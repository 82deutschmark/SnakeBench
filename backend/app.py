import os
import json
import random
import logging
import uuid
import argparse
import threading
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Import game logic and utilities
from main import run_simulation
from utils.utils import load_model_configs

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend
logging.basicConfig(level=logging.INFO)

# Global job tracker and executor
jobs = {}  # {job_id: job_info_dict}
jobs_lock = threading.Lock()
executor = ThreadPoolExecutor(max_workers=4)  # Configurable max workers

# Ensure jobs directory exists
os.makedirs('jobs', exist_ok=True)

# Helper functions
def save_job_manifest(job_id, job_info):
    """Save job information to jobs directory"""
    job_path = os.path.join('jobs', f'{job_id}.json')
    with open(job_path, 'w') as f:
        json.dump(job_info, f, indent=2)

def update_job_status(job_id, status, **kwargs):
    """Update job status in memory and on disk"""
    with jobs_lock:
        if job_id in jobs:
            jobs[job_id]['status'] = status
            jobs[job_id]['updated_at'] = datetime.now().isoformat()
            jobs[job_id].update(kwargs)
            save_job_manifest(job_id, jobs[job_id])

def run_match_task(job_id, model_config_1, model_config_2, game_params):
    """Background task to run a single match"""
    try:
        update_job_status(job_id, 'running')
        result = run_simulation(model_config_1, model_config_2, game_params)
        update_job_status(
            job_id,
            'completed',
            result=result,
            game_id=result['game_id']
        )
    except Exception as e:
        logging.error(f"Error in match task {job_id}: {e}")
        update_job_status(job_id, 'failed', error=str(e))

def run_batch_task(job_id, target_config, opponent_configs, game_params, num_simulations):
    """Background task to run batch simulations"""
    try:
        update_job_status(job_id, 'running', total=len(opponent_configs) * num_simulations, completed=0)
        results = []
        completed_count = 0

        for opponent_config in opponent_configs:
            for i in range(num_simulations):
                try:
                    result = run_simulation(target_config, opponent_config, game_params)
                    results.append(result)
                    completed_count += 1
                    update_job_status(job_id, 'running', completed=completed_count)
                except Exception as e:
                    logging.error(f"Error in batch simulation: {e}")

        update_job_status(
            job_id,
            'completed',
            results=results,
            total=len(opponent_configs) * num_simulations,
            completed=completed_count
        )
    except Exception as e:
        logging.error(f"Error in batch task {job_id}: {e}")
        update_job_status(job_id, 'failed', error=str(e))

# New API endpoints

@app.route("/api/health", methods=["GET"])
def health_check():
    """Check API health and environment configuration"""
    env_keys = {
        'OPENAI_API_KEY': bool(os.getenv('OPENAI_API_KEY')),
        'ANTHROPIC_API_KEY': bool(os.getenv('ANTHROPIC_API_KEY')),
        'GOOGLE_API_KEY': bool(os.getenv('GOOGLE_API_KEY')),
        'DEEPSEEK_API_KEY': bool(os.getenv('DEEPSEEK_API_KEY')),
        'XAI_API_KEY': bool(os.getenv('XAI_API_KEY')),
        'OPENROUTER_API_KEY': bool(os.getenv('OPENROUTER_API_KEY')),
        'OLLAMA_URL': os.getenv('OLLAMA_URL', 'http://localhost:11434')
    }

    return jsonify({
        'status': 'healthy',
        'environment': env_keys,
        'timestamp': datetime.now().isoformat()
    })

@app.route("/api/models", methods=["GET"])
def get_models():
    """Get list of available models from model_list.yaml"""
    try:
        model_configs = load_model_configs()
        models = [
            {
                'name': name,
                'provider': config.get('provider'),
                'pricing': config.get('pricing', {})
            }
            for name, config in model_configs.items()
        ]
        return jsonify({'models': models})
    except Exception as e:
        logging.error(f"Error loading models: {e}")
        return jsonify({'error': 'Failed to load model list'}), 500

@app.route("/api/match", methods=["POST"])
def start_match():
    """Start a single match between two models"""
    try:
        data = request.get_json()

        # Validate required fields
        if not data or 'models' not in data or len(data['models']) != 2:
            return jsonify({'error': 'Request must include exactly 2 model names in "models" array'}), 400

        # Load model configurations
        model_configs = load_model_configs()
        model_names = data['models']

        if model_names[0] not in model_configs:
            return jsonify({'error': f'Model "{model_names[0]}" not found'}), 404
        if model_names[1] not in model_configs:
            return jsonify({'error': f'Model "{model_names[1]}" not found'}), 404

        model_config_1 = model_configs[model_names[0]]
        model_config_2 = model_configs[model_names[1]]

        # Create game parameters namespace
        game_params = argparse.Namespace(
            width=data.get('width', 10),
            height=data.get('height', 10),
            max_rounds=data.get('max_rounds', 100),
            num_apples=data.get('num_apples', 5)
        )

        # Create job
        job_id = str(uuid.uuid4())
        job_info = {
            'job_id': job_id,
            'type': 'match',
            'status': 'queued',
            'models': model_names,
            'params': {
                'width': game_params.width,
                'height': game_params.height,
                'max_rounds': game_params.max_rounds,
                'num_apples': game_params.num_apples
            },
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }

        with jobs_lock:
            jobs[job_id] = job_info
        save_job_manifest(job_id, job_info)

        # Submit to executor
        executor.submit(run_match_task, job_id, model_config_1, model_config_2, game_params)

        return jsonify({
            'job_id': job_id,
            'status': 'queued',
            'message': 'Match started successfully'
        }), 202

    except Exception as e:
        logging.error(f"Error starting match: {e}")
        return jsonify({'error': str(e)}), 500

@app.route("/api/batch", methods=["POST"])
def start_batch():
    """Start batch simulations"""
    try:
        data = request.get_json()

        # Validate required fields
        if not data or 'targetModel' not in data:
            return jsonify({'error': 'Request must include "targetModel"'}), 400

        num_simulations = data.get('numSimulations', 5)
        max_output_cost = data.get('maxOutputCostPerMillion')
        max_workers = data.get('maxWorkers', 4)

        # Load model configurations
        model_configs = load_model_configs()
        target_model = data['targetModel']

        if target_model not in model_configs:
            return jsonify({'error': f'Target model "{target_model}" not found'}), 404

        target_config = model_configs[target_model]

        # Filter opponents
        opponent_configs = []
        for model_name, config in model_configs.items():
            if model_name == target_model:
                continue

            # Check pricing if filter specified
            if max_output_cost is not None:
                pricing = config.get('pricing', {})
                if 'output' not in pricing or pricing['output'] > max_output_cost:
                    continue

            opponent_configs.append(config)

        if not opponent_configs:
            return jsonify({'error': 'No valid opponents found after filtering'}), 400

        # Create game parameters
        game_params = argparse.Namespace(
            width=data.get('width', 10),
            height=data.get('height', 10),
            max_rounds=data.get('max_rounds', 100),
            num_apples=data.get('num_apples', 5)
        )

        # Create job
        job_id = str(uuid.uuid4())
        job_info = {
            'job_id': job_id,
            'type': 'batch',
            'status': 'queued',
            'target_model': target_model,
            'num_opponents': len(opponent_configs),
            'num_simulations': num_simulations,
            'total_matches': len(opponent_configs) * num_simulations,
            'params': {
                'width': game_params.width,
                'height': game_params.height,
                'max_rounds': game_params.max_rounds,
                'num_apples': game_params.num_apples,
                'max_output_cost': max_output_cost
            },
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }

        with jobs_lock:
            jobs[job_id] = job_info
        save_job_manifest(job_id, job_info)

        # Submit to executor
        executor.submit(run_batch_task, job_id, target_config, opponent_configs, game_params, num_simulations)

        return jsonify({
            'job_id': job_id,
            'status': 'queued',
            'message': f'Batch started: {len(opponent_configs)} opponents, {num_simulations} simulations each',
            'total_matches': len(opponent_configs) * num_simulations
        }), 202

    except Exception as e:
        logging.error(f"Error starting batch: {e}")
        return jsonify({'error': str(e)}), 500

@app.route("/api/jobs/<job_id>", methods=["GET"])
def get_job_status(job_id):
    """Get status of a specific job"""
    with jobs_lock:
        if job_id not in jobs:
            # Try loading from disk
            job_path = os.path.join('jobs', f'{job_id}.json')
            if os.path.exists(job_path):
                with open(job_path, 'r') as f:
                    job_info = json.load(f)
                    jobs[job_id] = job_info
            else:
                return jsonify({'error': 'Job not found'}), 404

        job_info = jobs[job_id].copy()

    return jsonify(job_info)

# Endpoint to mimic GET requests for a list of games.
# Mimics functionality in frontend/src/app/api/games/route.ts
@app.route("/api/games", methods=["GET"])
def get_games():
    try:
        print("Getting games")
        # Get the number of games to return from query parameters, default to 10
        limit = request.args.get("limit", default=10, type=int)
        sort_by = request.args.get("sort_by", default="start_time", type=str)

        # Load the game index
        game_index_path = os.path.join(os.getcwd(), "completed_games", "game_index.json")
        with open(game_index_path, "r", encoding="utf-8") as f:
            game_index = json.load(f)

        # Sort the index based on the sort_by parameter
        if sort_by == "start_time":
            sorted_index = sorted(game_index, key=lambda x: x["start_time"], reverse=True)
        elif sort_by == "total_score":
            sorted_index = sorted(game_index, key=lambda x: x["total_score"], reverse=True)
        elif sort_by == "actual_rounds":
            sorted_index = sorted(game_index, key=lambda x: x["actual_rounds"], reverse=True)
        else:
            # For random order, just take random sample directly from index
            selected_games_index = random.sample(game_index, min(limit, len(game_index)))
            sorted_index = None

        # For sorted queries, take only the top N records we need
        if sorted_index is not None:
            selected_games_index = sorted_index[:min(limit, len(sorted_index))]

        # Only load the specific games we need
        valid_games = []
        games_dir = os.path.join(os.getcwd(), "completed_games")
        for record in selected_games_index:
            file_path = os.path.join(games_dir, record["filename"])
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    game_data = json.load(f)
                    valid_games.append(game_data)
            except Exception as e:
                logging.error(f"Error reading or parsing file {file_path}: {e}")
                continue

        print(f"Returning {len(valid_games)} games")
        return jsonify({"games": valid_games})
    
    except Exception as error:
        logging.error(f"Error reading game index or files: {error}")
        return jsonify({"error": "Failed to load game list"}), 500


# Endpoint to mimic the stats API.
# Mimics functionality in frontend/src/app/api/stats/route.ts
@app.route("/api/stats", methods=["GET"])
def get_stats():
    # Get the query parameters: simple for summary stats,
    # model for full stats for a single model
    simple = request.args.get("simple", default=False, type=bool)
    model = request.args.get("model", default=None, type=str)

    if simple:
        # This branch returns the simple version
        stats_path = os.path.join(os.getcwd(), "completed_games", "stats_simple.json")
        try:
            with open(stats_path, "r", encoding="utf-8") as f:
                stats_data = json.load(f)
        except Exception as e:
            logging.error(f"Error loading simple stats data: {e}")
            stats_data = {}
        return jsonify({
            "totalGames": 0,  # You could update this if available in stats_data
            "aggregatedData": stats_data
        })

    # For full stats, we require a model parameter.
    if model is None:
        return jsonify({"error": "Please provide a model parameter for full stats."}), 400

    stats_path = os.path.join(os.getcwd(), "completed_games", "stats.json")
    try:
        with open(stats_path, "r", encoding="utf-8") as f:
            stats_data = json.load(f)
    except Exception as e:
        logging.error(f"Error loading full stats data: {e}")
        return jsonify({"error": "Failed to load stats data."}), 500

    model_stats = stats_data.get(model)
    if model_stats is None:
        return jsonify({"error": f"Stats for model '{model}' not found."}), 404

    # Since the full stats already include wins/losses, simply return the model's stats.
    total_games = model_stats.get("wins", 0) + model_stats.get("losses", 0) + model_stats.get("ties", 0)
    return jsonify({
        "totalGames": total_games,
        "aggregatedData": {model: model_stats}
    })


# Endpoint to get details for a single game by id.
# Mimics functionality in frontend/src/app/api/games/[gameId]/route.ts
@app.route("/api/matches/<match_id>", methods=["GET"])
def get_game_by_id(match_id):
    try:
        # Construct the file path using the game_id.
        match_filename = f"snake_game_{match_id}.json"
        match_file_path = os.path.join(os.getcwd(), "completed_games", match_filename)

        with open(match_file_path, "r", encoding="utf-8") as f:
            match_data = json.load(f)
        
        return jsonify(match_data)
    
    except Exception as error:
        logging.error(f"Error reading match data for match id {match_id}: {error}")
        return jsonify({"error": "Failed to load match data"}), 500

if __name__ == "__main__":
    # Run the Flask app in debug mode.
    app.run(debug=os.getenv("FLASK_DEBUG"))