'use client';

import { useState, useEffect } from 'react';
import { apiClient, Model } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function BatchLauncher() {
  const [models, setModels] = useState<Model[]>([]);
  const [targetModel, setTargetModel] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Batch parameters
  const [numSimulations, setNumSimulations] = useState(5);
  const [maxOutputCost, setMaxOutputCost] = useState<number | null>(10);
  const [maxWorkers, setMaxWorkers] = useState(4);

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
      if (response.models.length > 0) {
        setTargetModel(response.models[0].name);
      }
    } catch (err) {
      setError('Failed to load models');
      console.error(err);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleStartBatch = async () => {
    if (!targetModel) {
      setError('Please select a target model');
      return;
    }

    setLoading(true);
    setError(null);
    setJobId(null);
    setStatus('');
    setProgress(null);

    try {
      const response = await apiClient.startBatch({
        targetModel,
        numSimulations,
        maxOutputCostPerMillion: maxOutputCost || undefined,
        maxWorkers,
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
          if (jobStatus.completed !== undefined && jobStatus.total !== undefined) {
            setProgress({ completed: jobStatus.completed, total: jobStatus.total });
          }
        }
      ).then((finalStatus) => {
        setStatus('completed');
        if (finalStatus.completed !== undefined && finalStatus.total !== undefined) {
          setProgress({ completed: finalStatus.completed, total: finalStatus.total });
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
        <h2 className="text-lg font-press-start text-gray-900 mb-4">Launch Batch</h2>
        <p className="text-sm font-mono text-gray-500">Loading models...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-press-start text-gray-900 mb-4">Launch Batch</h2>

      <div className="space-y-4">
        {/* Target Model Selection */}
        <div>
          <label className="block text-sm font-mono font-medium text-gray-700 mb-2">
            Target Model
          </label>
          <select
            value={targetModel}
            onChange={(e) => setTargetModel(e.target.value)}
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

        {/* Batch Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-mono font-medium text-gray-700 mb-2">
              Simulations per Opponent
            </label>
            <input
              type="number"
              value={numSimulations}
              onChange={(e) => setNumSimulations(parseInt(e.target.value))}
              disabled={loading}
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-mono font-medium text-gray-700 mb-2">
              Max Output Cost Filter
            </label>
            <input
              type="number"
              value={maxOutputCost || ''}
              onChange={(e) => setMaxOutputCost(e.target.value ? parseFloat(e.target.value) : null)}
              disabled={loading}
              step="0.1"
              placeholder="No limit"
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-mono font-medium text-gray-700 mb-2">
              Max Workers
            </label>
            <input
              type="number"
              value={maxWorkers}
              onChange={(e) => setMaxWorkers(parseInt(e.target.value))}
              disabled={loading}
              min="1"
              max="16"
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Game Parameters */}
        <details className="border border-gray-200 rounded p-4">
          <summary className="cursor-pointer text-sm font-mono font-medium text-gray-700">
            Game Settings
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
          onClick={handleStartBatch}
          disabled={loading || !targetModel}
          className="w-full font-mono"
        >
          {loading ? 'Starting Batch...' : 'Launch Batch'}
        </Button>

        {/* Status Display */}
        {jobId && (
          <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
            <p className="text-xs font-mono text-gray-600">Job ID: {jobId}</p>
            <p className="text-sm font-mono text-gray-900 mt-1">
              Status: <span className="font-bold uppercase">{status}</span>
            </p>
            {progress && (
              <div className="mt-2">
                <div className="flex justify-between text-xs font-mono text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{progress.completed}/{progress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
            {status === 'completed' && (
              <div className="mt-2">
                <a
                  href="/"
                  className="text-sm font-mono text-blue-600 hover:text-blue-800 hover:underline"
                >
                  View Updated Leaderboard →
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
