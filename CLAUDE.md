# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LLM Snake Arena is a competitive simulation platform where Large Language Models (LLMs) battle each other in a snake game. The project consists of:

- **Backend (Python)**: Core game simulation engine with LLM integration
- **Frontend (Next.js)**: Real-time visualization dashboard with leaderboards and game replays

## Development Commands

### Backend (Python)

**Prerequisites:**
```bash
cd backend
pip install -r requirements.txt
# Create .env file with API keys for LLM providers
# Required API keys (depending on which models you want to use):
# - OPENAI_API_KEY (for GPT-4.1, GPT-5, o3/o4 models)
# - ANTHROPIC_API_KEY (for Claude 3.x/4.x models)
# - GOOGLE_API_KEY (for Gemini 2.x models)
# - DEEPSEEK_API_KEY (for DeepSeek Chat/Reasoner models)
# - XAI_API_KEY (for Grok-4 models)
# - OPENROUTER_API_KEY (for OpenRouter models: Llama, Mistral, Qwen, etc.)
# - OLLAMA_URL (optional, for local Ollama models, defaults to http://localhost:11434)
```

**Running Simulations:**
```bash
# Single game between two models
python3 main.py --models gpt-4o-mini-2024-07-18 claude-3-haiku-20240307

# With custom game parameters
python3 main.py --models <model1> <model2> --width 10 --height 10 --max_rounds 100 --num_apples 5

# Ollama models (must be prefixed with ollama- in model_list.yaml)
python3 main.py --models ollama-llama3.2 ollama-llama3.3

# Batch simulations: Run target model against multiple opponents
python3 run_batch.py --target-model "my-model" --num-simulations 5

# With cost filtering (only opponents cheaper than specified output cost per million tokens)
python3 run_batch.py --target-model "my-model" --num-simulations 5 --max-output-cost-per-million 10.0

# With parallelism control
python3 run_batch.py --target-model "my-model" --num-simulations 5 --max-workers 8
```

**Updating Rankings:**
```bash
# Update Elo ratings after running simulations
python3 elo_tracker.py completed_games --output completed_games
```

**API Server:**
```bash
# Start Flask API server (serves game data to frontend)
python3 -m app
# Or with gunicorn for production
gunicorn app:app
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # Run ESLint
```

**Development Session:**
The `.startsession` script starts both backend API and frontend in a tmux session:
```bash
# Starts backend Flask API and frontend dev server in split panes
./.startsession
```

## Architecture

### Backend Structure

**Game Simulation Flow:**
1. **main.py**: Core game engine
   - `Snake` class: Represents snake with deque of positions
   - `GameState` class: Snapshot of board state per round
   - `LLMPlayer` class: Interfaces with LLM providers to get next move
   - `run_simulation()`: Main game loop handling moves, collisions, apple spawning, scoring
   - Game results saved as JSON files in `completed_games/`

2. **LLM Integration (llm_providers.py)**:
   - `LLMProviderInterface`: Abstract base class for all LLM providers
   - Provider implementations: `OpenAIProvider`, `AnthropicProvider`, `GoogleProvider` (Gemini), `DeepSeekProvider`, `xAIProvider`, `OpenRouterProvider`, `OllamaProvider`
   - Each provider initialized with model config from `model_list.yaml`
   - Fallback mechanism: If LLM response is unclear, random valid move is selected

3. **Batch Processing (run_batch.py)**:
   - Uses `concurrent.futures.ThreadPoolExecutor` for parallel in-process execution
   - Filters opponents based on pricing criteria from `model_list.yaml`
   - Submits multiple simulation tasks and processes results as they complete

4. **Elo Tracking (elo_tracker.py)**:
   - Processes completed games to calculate Elo ratings
   - Head-to-head comparisons between all players in multi-player games
   - Updates `completed_games/stats_simple.json` with aggregated stats

5. **API Server (app.py)**:
   - Flask endpoints:
     - `GET /api/games`: Returns game history (supports limit, sort_by parameters)
     - `GET /api/stats`: Returns aggregated statistics and Elo ratings
   - Reads from `completed_games/game_index.json` for fast queries

**Key Data Files:**
- `backend/model_lists/model_list.yaml`: Model configurations with pricing info
- `backend/completed_games/`: Directory containing JSON files of completed games
- `backend/completed_games/game_index.json`: Index of all games for fast queries
- `backend/completed_games/stats_simple.json`: Aggregated statistics and Elo ratings

### Frontend Structure

**Tech Stack:**
- Next.js 15 with React 19
- TypeScript
- Tailwind CSS with shadcn/ui components
- PostHog for analytics

**Key Components:**
- `src/app/page.tsx`: Main dashboard with leaderboard and recent matches
- `src/components/match/GameViewer.tsx`: Game replay viewer
- `src/components/match/GameCanvas.tsx`: Canvas-based game visualization
- `src/app/match/[id]/page.tsx`: Individual match detail page
- `src/app/models/[id]/page.tsx`: Individual model statistics page

**Data Flow:**
- Frontend fetches data from Flask API endpoints (`/api/games`, `/api/stats`)
- Game replays use round-by-round history from JSON files
- ASCII rendering component shows board state with snakes and apples

## Model Configuration

Models are defined in `backend/model_lists/model_list.yaml` with the following structure:
- `name`: Unique identifier used in commands
- `model_name`: Actual model ID passed to API
- `provider`: One of: openai, anthropic, google, deepseek, xai, openrouter, ollama
- `max_completion_tokens` or `max_tokens`: Token limit for responses
- `pricing`: Object with `input` and `output` costs per million tokens (used for cost filtering)
- `reasoning_effort`: (o3/o4 models only) One of: low, medium, high
- Additional provider-specific parameters as needed

**Supported Providers (November 2025):**
- **OpenAI**: GPT-4.1, GPT-5 series, o3/o4 reasoning models
- **Anthropic**: Claude 3.x, 3.5, 3.7, 4.x, 4.5 models
- **Google**: Gemini 2.0 and 2.5 series
- **DeepSeek**: DeepSeek Chat, DeepSeek Reasoner (direct API)
- **xAI**: Grok-4 models (direct API)
- **OpenRouter**: Meta Llama, Mistral, Qwen, xAI Grok-3, Nvidia, Amazon Nova, and many others
- **Ollama**: Local models (prefix name with `ollama-`)

**Adding New Models:**
1. Add entry to `model_list.yaml` with proper pricing information
2. Ensure API keys for the provider are in `backend/.env`
3. For Ollama models, prefix name with `ollama-`
4. Refer to `backend/model_lists/models.md` for comprehensive model list

## Game Mechanics

**Board Coordinates:**
- Origin (0,0) at bottom-left corner
- x-axis increases right, y-axis increases up

**Collision Rules:**
- Wall collisions: Moving outside board bounds
- Body collisions: Moving into any snake body (including own)
- Head-to-head: If multiple snake heads land on same cell, all involved snakes die

**Scoring:**
- Each apple eaten increases score by 1 and grows snake by 1 segment
- Multiple apples spawn on board simultaneously (`--num_apples` parameter)

**Game End Conditions:**
- Only one snake remains alive
- Maximum rounds reached (`--max_rounds` parameter)
- Result per snake: "won", "lost", or "tied"

## LLM Prompting

The game constructs detailed prompts for each LLM containing:
- Current board state with coordinates
- All snake positions (head and body)
- All apple positions
- Last move and rationale (if available)
- Valid move directions

LLMs must respond with a recommended direction (UP, DOWN, LEFT, RIGHT) and optional rationale for the next move.
