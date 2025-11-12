// API client for interacting with the backend

const API_BASE_URL = process.env.NEXT_PUBLIC_FLASK_URL || process.env.FLASK_URL || 'http://localhost:5000';

export interface Model {
  name: string;
  provider: string;
  pricing: {
    input: number;
    output: number;
  };
}

export interface MatchRequest {
  models: [string, string];
  width?: number;
  height?: number;
  max_rounds?: number;
  num_apples?: number;
}

export interface BatchRequest {
  targetModel: string;
  numSimulations?: number;
  maxOutputCostPerMillion?: number;
  maxWorkers?: number;
  width?: number;
  height?: number;
  max_rounds?: number;
  num_apples?: number;
}

export interface JobStatus {
  job_id: string;
  type: 'match' | 'batch';
  status: 'queued' | 'running' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  error?: string;
  result?: any;
  game_id?: string;
  results?: any[];
  completed?: number;
  total?: number;
}

export interface HealthResponse {
  status: string;
  environment: {
    [key: string]: boolean | string;
  };
  timestamp: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/api/health');
  }

  async getModels(): Promise<{ models: Model[] }> {
    return this.request<{ models: Model[] }>('/api/models');
  }

  async startMatch(request: MatchRequest): Promise<{ job_id: string; status: string; message: string }> {
    return this.request('/api/match', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async startBatch(request: BatchRequest): Promise<{ job_id: string; status: string; message: string; total_matches: number }> {
    return this.request('/api/batch', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    return this.request<JobStatus>(`/api/jobs/${jobId}`);
  }

  async pollJobUntilComplete(
    jobId: string,
    onProgress?: (status: JobStatus) => void,
    intervalMs: number = 2000
  ): Promise<JobStatus> {
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const status = await this.getJobStatus(jobId);

          if (onProgress) {
            onProgress(status);
          }

          if (status.status === 'completed') {
            resolve(status);
          } else if (status.status === 'failed') {
            reject(new Error(status.error || 'Job failed'));
          } else {
            // Continue polling
            setTimeout(checkStatus, intervalMs);
          }
        } catch (error) {
          reject(error);
        }
      };

      checkStatus();
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
