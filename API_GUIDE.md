# SnakeBench API & UI Guide

This guide explains how to run matches and batch simulations using the REST API and web UI, without needing to use the CLI.

## Table of Contents

- [Quick Start](#quick-start)
- [Web UI](#web-ui)
- [REST API](#rest-api)
- [Environment Setup](#environment-setup)
- [Examples](#examples)

## Quick Start

### Starting the Services

1. **Backend API Server:**
   ```bash
   cd backend
   source venv/bin/activate  # if using venv
   pip install -r requirements.txt  # ensure flask-cors is installed
   python3 -m app
   # Server runs on http://localhost:5000
   ```

2. **Frontend Development Server:**
   ```bash
   cd frontend
   npm install
   npm run dev
   # Server runs on http://localhost:3000
   ```

3. **Or use the automated script:**
   ```bash
   ./.startsession  # Starts both in tmux
   ```

## Web UI

### Accessing the Launcher

Navigate to http://localhost:3000/launcher to access the web interface.

### Match Launcher

Start a single match between two models:

1. Select two models from the dropdowns
2. (Optional) Adjust game parameters in "Advanced Settings":
   - Board width/height
   - Max rounds
   - Number of apples
3. Click "Launch Match"
4. Monitor the job status
5. Click "View Match Replay" when complete

### Batch Launcher

Run multiple simulations of a target model against filtered opponents:

1. Select a target model
2. Configure batch parameters:
   - **Simulations per Opponent**: How many games to run against each opponent
   - **Max Output Cost Filter**: Only include opponents with output cost below this threshold (per million tokens)
   - **Max Workers**: Number of parallel workers for execution
3. (Optional) Adjust game settings
4. Click "Launch Batch"
5. Monitor progress bar
6. View updated leaderboard when complete

## REST API

Base URL: `http://localhost:5000` (or your configured `FLASK_URL`)

### Endpoints

#### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "environment": {
    "OPENAI_API_KEY": true,
    "ANTHROPIC_API_KEY": true,
    "GOOGLE_API_KEY": false,
    "DEEPSEEK_API_KEY": true,
    "XAI_API_KEY": false,
    "OPENROUTER_API_KEY": true,
    "OLLAMA_URL": "http://localhost:11434"
  },
  "timestamp": "2025-11-11T12:34:56.789"
}
```

#### Get Available Models

```http
GET /api/models
```

**Response:**
```json
{
  "models": [
    {
      "name": "gpt-4o-mini-2024-07-18",
      "provider": "openai",
      "pricing": {
        "input": 0.15,
        "output": 0.60
      }
    },
    {
      "name": "claude-3-haiku-20240307",
      "provider": "anthropic",
      "pricing": {
        "input": 0.25,
        "output": 1.25
      }
    }
  ]
}
```

#### Start a Match

```http
POST /api/match
Content-Type: application/json

{
  "models": ["gpt-4o-mini-2024-07-18", "claude-3-haiku-20240307"],
  "width": 10,
  "height": 10,
  "max_rounds": 100,
  "num_apples": 5
}
```

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "message": "Match started successfully"
}
```

#### Start a Batch

```http
POST /api/batch
Content-Type: application/json

{
  "targetModel": "gpt-4o-mini-2024-07-18",
  "numSimulations": 5,
  "maxOutputCostPerMillion": 10.0,
  "maxWorkers": 4,
  "width": 10,
  "height": 10,
  "max_rounds": 100,
  "num_apples": 5
}
```

**Response:**
```json
{
  "job_id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "queued",
  "message": "Batch started: 15 opponents, 5 simulations each",
  "total_matches": 75
}
```

#### Get Job Status

```http
GET /api/jobs/{job_id}
```

**Response (Queued):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "match",
  "status": "queued",
  "models": ["gpt-4o-mini-2024-07-18", "claude-3-haiku-20240307"],
  "params": {
    "width": 10,
    "height": 10,
    "max_rounds": 100,
    "num_apples": 5
  },
  "created_at": "2025-11-11T12:34:56.789",
  "updated_at": "2025-11-11T12:34:56.789"
}
```

**Response (Running):**
```json
{
  "job_id": "660e8400-e29b-41d4-a716-446655440001",
  "type": "batch",
  "status": "running",
  "target_model": "gpt-4o-mini-2024-07-18",
  "completed": 25,
  "total": 75,
  "created_at": "2025-11-11T12:34:56.789",
  "updated_at": "2025-11-11T12:35:30.123"
}
```

**Response (Completed - Match):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "match",
  "status": "completed",
  "game_id": "abc123def456",
  "result": {
    "game_id": "abc123def456",
    "final_scores": {
      "0": 5,
      "1": 3
    },
    "game_result": {
      "0": "won",
      "1": "lost"
    }
  },
  "created_at": "2025-11-11T12:34:56.789",
  "updated_at": "2025-11-11T12:36:15.456"
}
```

**Response (Failed):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "match",
  "status": "failed",
  "error": "Model 'invalid-model' not found",
  "created_at": "2025-11-11T12:34:56.789",
  "updated_at": "2025-11-11T12:34:57.123"
}
```

## Environment Setup

### Backend Environment Variables

Create a `backend/.env` file with your API keys:

```bash
# Required for OpenAI models
OPENAI_API_KEY=sk-...

# Required for Anthropic models
ANTHROPIC_API_KEY=sk-ant-...

# Required for Google Gemini models
GOOGLE_API_KEY=AIza...

# Required for DeepSeek models
DEEPSEEK_API_KEY=sk-...

# Required for xAI Grok models
XAI_API_KEY=xai-...

# Required for OpenRouter models
OPENROUTER_API_KEY=sk-or-...

# Optional: for local Ollama models
OLLAMA_URL=http://localhost:11434
```

### Frontend Environment Variables

Create a `frontend/.env.local` file:

```bash
# Backend API URL
FLASK_URL=http://localhost:5000

# Or for production
# FLASK_URL=https://your-backend-domain.com
```

## Examples

### Example 1: Quick Match via cURL

```bash
# Start a match
curl -X POST http://localhost:5000/api/match \
  -H "Content-Type: application/json" \
  -d '{
    "models": ["gpt-4o-mini-2024-07-18", "claude-3-haiku-20240307"],
    "width": 10,
    "height": 10,
    "max_rounds": 100,
    "num_apples": 5
  }'

# Response: {"job_id": "abc-123", ...}

# Check status
curl http://localhost:5000/api/jobs/abc-123

# When completed, view match at:
# http://localhost:3000/match/{game_id}
```

### Example 2: Batch with Cost Filtering

```bash
# Start a batch with cost limit
curl -X POST http://localhost:5000/api/batch \
  -H "Content-Type: application/json" \
  -d '{
    "targetModel": "gpt-4o-mini-2024-07-18",
    "numSimulations": 10,
    "maxOutputCostPerMillion": 5.0,
    "maxWorkers": 8
  }'

# Only opponents with output cost ≤ $5/million tokens will be included
```

### Example 3: Python Client

```python
import requests
import time

API_BASE = "http://localhost:5000"

# Start a match
response = requests.post(f"{API_BASE}/api/match", json={
    "models": ["gpt-4o-mini-2024-07-18", "claude-3-haiku-20240307"],
    "width": 10,
    "height": 10,
    "max_rounds": 100,
    "num_apples": 5
})

job_id = response.json()["job_id"]
print(f"Job started: {job_id}")

# Poll for completion
while True:
    status_response = requests.get(f"{API_BASE}/api/jobs/{job_id}")
    status = status_response.json()

    print(f"Status: {status['status']}")

    if status["status"] == "completed":
        game_id = status["game_id"]
        print(f"Match completed! Game ID: {game_id}")
        print(f"View at: http://localhost:3000/match/{game_id}")
        break
    elif status["status"] == "failed":
        print(f"Match failed: {status.get('error')}")
        break

    time.sleep(2)
```

### Example 4: JavaScript/TypeScript Client

```typescript
const API_BASE = "http://localhost:5000";

async function startMatch() {
  const response = await fetch(`${API_BASE}/api/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      models: ["gpt-4o-mini-2024-07-18", "claude-3-haiku-20240307"],
      width: 10,
      height: 10,
      max_rounds: 100,
      num_apples: 5,
    }),
  });

  const { job_id } = await response.json();
  console.log(`Job started: ${job_id}`);

  // Poll for completion
  const pollStatus = async () => {
    const statusResponse = await fetch(`${API_BASE}/api/jobs/${job_id}`);
    const status = await statusResponse.json();

    console.log(`Status: ${status.status}`);

    if (status.status === "completed") {
      console.log(`Match completed! Game ID: ${status.game_id}`);
      return status;
    } else if (status.status === "failed") {
      throw new Error(status.error);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return pollStatus();
    }
  };

  return await pollStatus();
}

startMatch().then(console.log).catch(console.error);
```

## Job Tracking

All jobs are tracked in the `backend/jobs/` directory. Each job gets a JSON manifest file with its current status, parameters, and results.

Job manifests persist across server restarts, so you can query the status of jobs even after restarting the backend.

## Concurrency

- The backend uses a ThreadPoolExecutor to run matches in the background
- Multiple matches/batches can be queued and executed concurrently
- Default max workers: 4 (configurable in `backend/app.py`)
- Batch simulations also support configurable parallelism via the `maxWorkers` parameter

## Troubleshooting

### Issue: Models not loading

**Solution:** Check `/api/health` to verify API keys are configured correctly.

### Issue: Matches fail immediately

**Solution:**
- Verify the model names are correct (check `/api/models`)
- Ensure you have the required API keys for both models
- Check backend logs for detailed error messages

### Issue: Frontend can't connect to backend

**Solution:**
- Verify backend is running on port 5000
- Check `FLASK_URL` environment variable in frontend
- Ensure CORS is enabled (flask-cors installed)

### Issue: Job status not updating

**Solution:**
- Jobs are processed asynchronously; allow time for execution
- Check `backend/jobs/{job_id}.json` for persisted status
- Verify backend logs for execution errors

## API Rate Limits & Costs

Remember that each match makes API calls to the LLM providers. Be mindful of:

- **Rate limits**: Different providers have different rate limits
- **Costs**: Monitor your API usage, especially for batch simulations
- **Concurrency**: Adjust `maxWorkers` based on your rate limits and budget

Use the `maxOutputCostPerMillion` filter in batch mode to control costs by excluding expensive models.
