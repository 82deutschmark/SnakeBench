'use client';

import { useState, useEffect } from 'react';
import { apiClient, Model } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function MatchLauncher() {
  const [models, setModels] = useState<Model[]>([]);
  const [model1, setModel1] = useState<string>('');
  const [model2, setModel2] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [gameId, setGameId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Game parameters
  const [width, setWidth] = useState(10);
  const [height, setHeight] = useState(10);
  const [maxRounds, setMaxRounds] = useState(100);
  const [numApples, setNumApples] = useState(5);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const response = await apiClient.getModels();
      setModels(response.models);
      if (response.models.length >= 2) {
        setModel1(response.models[0].name);
        setModel2(response.models[1].name);
      }
    } catch (err) {
      setError('Failed to load models');
      console.error(err);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleStartMatch = async () => {
    if (!model1 || !model2) {
      setError('Please select both models');
      return;
    }

    if (model1 === model2) {
      setError('Please select different models');
      return;
    }

    setLoading(true);
    setError(null);
    setJobId(null);
    setGameId(null);
    setStatus('');

    try {
      const response = await apiClient.startMatch({
        models: [model1, model2],
        width,
        height,
        max_rounds: maxRounds,
        num_apples: numApples,
      });

      setJobId(response.job_id);
      setStatus('queued');

      // Poll for completion
      apiClient.pollJobUntilComplete(
        response.job_id,
        (jobStatus) => {
          setStatus(jobStatus.status);
          if (jobStatus.game_id) {
            setGameId(jobStatus.game_id);
          }
        }
      ).then((finalStatus) => {
        setStatus('completed');
        if (finalStatus.game_id) {
          setGameId(finalStatus.game_id);
        }
      }).catch((err) => {
        setError(err.message);
        setStatus('failed');
      }).finally(() => {
        setLoading(false);
      });

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loadingModels) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-press-start text-gray-900 mb-4">Launch Match</h2>
        <p className="text-sm font-mono text-gray-500">Loading models...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-press-start text-gray-900 mb-4">Launch Match</h2>

      <div className="space-y-4">
        {/* Model Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-mono font-medium text-gray-700 mb-2">
              Model 1
            </label>
            <select
              value={model1}
              onChange={(e) => setModel1(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-mono font-medium text-gray-700 mb-2">
              Model 2
            </label>
            <select
              value={model2}
              onChange={(e) => setModel2(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Game Parameters */}
        <details className="border border-gray-200 rounded p-4">
          <summary className="cursor-pointer text-sm font-mono font-medium text-gray-700">
            Advanced Settings
          </summary>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-600 mb-1">Width</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value))}
                disabled={loading}
                min="5"
                max="20"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-600 mb-1">Height</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value))}
                disabled={loading}
                min="5"
                max="20"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-600 mb-1">Max Rounds</label>
              <input
                type="number"
                value={maxRounds}
                onChange={(e) => setMaxRounds(parseInt(e.target.value))}
                disabled={loading}
                min="10"
                max="500"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-600 mb-1">Apples</label>
              <input
                type="number"
                value={numApples}
                onChange={(e) => setNumApples(parseInt(e.target.value))}
                disabled={loading}
                min="1"
                max="10"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
              />
            </div>
          </div>
        </details>

        {/* Launch Button */}
        <Button
          onClick={handleStartMatch}
          disabled={loading || !model1 || !model2}
          className="w-full font-mono"
        >
          {loading ? 'Starting Match...' : 'Launch Match'}
        </Button>

        {/* Status Display */}
        {jobId && (
          <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
            <p className="text-xs font-mono text-gray-600">Job ID: {jobId}</p>
            <p className="text-sm font-mono text-gray-900 mt-1">
              Status: <span className="font-bold uppercase">{status}</span>
            </p>
            {gameId && (
              <div className="mt-2">
                <a
                  href={`/match/${gameId}`}
                  className="text-sm font-mono text-blue-600 hover:text-blue-800 hover:underline"
                >
                  View Match Replay →
                </a>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded border border-red-200">
            <p className="text-sm font-mono text-red-800">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
