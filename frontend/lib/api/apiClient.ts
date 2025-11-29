/**
 * API Client for Fraud Detection System
 * Handles all HTTP communication with FastAPI backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  PredictionResult,
  ProcessedTransaction,
  BatchPredictionRequest,
} from '@/types/transaction';

// ============================================================================
// ADDITIONAL TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
}

export interface HealthCheckResponse {
  status: string;
  model_loaded?: boolean;
  timestamp?: string;
}

export interface BatchPredictionResponse {
  predictions: PredictionResult[];
  total: number;
  fraud_count: number;
  normal_count: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_TIMEOUT = 30000; // 30 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

/**
 * Create axios instance with default configuration
 */
const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      // Add timestamp to all requests
      config.headers['X-Request-Time'] = new Date().toISOString();

      // Log request (always log for debugging 422 errors)
      if (config.url === '/predict' && config.data) {
        const fieldCount = typeof config.data === 'object' ? Object.keys(config.data).length : 0;
        const sampleKeys = typeof config.data === 'object' ? Object.keys(config.data).slice(0, 5) : [];
        console.log(`[API] POST /predict - Fields: ${fieldCount}, Sample: ${sampleKeys.join(', ')}`);
        console.log('[API] Full payload:', config.data);
      } else if (process.env.NODE_ENV === 'development') {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
          data: config.data,
          params: config.params,
        });
      }

      return config;
    },
    (error) => {
      console.error('[API] Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      // Log response in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] Response ${response.status}:`, response.data);
      }

      return response;
    },
    async (error: AxiosError) => {
      // Log error
      console.error('[API] Response error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      // Handle specific error cases
      if (error.code === 'ECONNABORTED') {
        throw new ApiError('Request timeout. Please try again.', 408);
      }

      if (!error.response) {
        throw new ApiError(
          'Network error. Please check your connection.',
          0
        );
      }

      if (error.response.status === 429) {
        throw new ApiError('Too many requests. Please wait a moment.', 429);
      }

      if (error.response.status >= 500) {
        throw new ApiError('Server error. Please try again later.', error.response.status);
      }

      // Handle 422 validation errors and other client errors
      const responseData = error.response.data as any;
      let errorMessage = error.message;

      if (responseData) {
        // Try different error message formats
        if (typeof responseData.message === 'string') {
          errorMessage = responseData.message;
          // Add detail if available
          if (responseData.detail) {
            errorMessage += `\n${responseData.detail}`;
          }
        } else if (typeof responseData.detail === 'string') {
          errorMessage = responseData.detail;
        } else if (typeof responseData.error === 'string') {
          errorMessage = responseData.error;
        }
      }

      throw new ApiError(
        errorMessage,
        error.response.status,
        responseData
      );
    }
  );

  return instance;
};

// ============================================================================
// CUSTOM ERROR CLASS
// ============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  isNetworkError(): boolean {
    return this.statusCode === 0;
  }

  isTimeout(): boolean {
    return this.statusCode === 408;
  }

  isServerError(): boolean {
    return this.statusCode >= 500;
  }

  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

export class FraudDetectionApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = createApiClient();
  }

  // ==========================================================================
  // HEALTH CHECK
  // ==========================================================================

  /**
   * Check if API is healthy and ready
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await this.client.get<HealthCheckResponse>('/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Health check failed');
    }
  }

  // ==========================================================================
  // PREDICTION ENDPOINTS
  // ==========================================================================

  /**
   * Predict fraud for a single transaction
   */
  async predictSingle(
    transaction: ProcessedTransaction
  ): Promise<PredictionResult> {
    try {
      const response = await this.client.post<ApiResponse<PredictionResult>>(
        '/predict',
        transaction
      );

      return (response.data.data || response.data) as PredictionResult;
    } catch (error) {
      throw this.handleError(error, 'Prediction failed');
    }
  }

  /**
   * Predict fraud for multiple transactions (batch)
   */
  async predictBatch(
    request: BatchPredictionRequest
  ): Promise<BatchPredictionResponse> {
    try {
      const response = await this.client.post<BatchPredictionResponse>(
        '/predict/batch',
        request
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Batch prediction failed');
    }
  }

  /**
   * Predict with retry logic
   */
  async predictWithRetry(
    transaction: ProcessedTransaction,
    maxAttempts: number = RETRY_ATTEMPTS
  ): Promise<PredictionResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.predictSingle(transaction);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof ApiError && error.isClientError()) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxAttempts) {
          const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
          await this.sleep(delay);
          console.log(`[API] Retry attempt ${attempt + 1}/${maxAttempts}`);
        }
      }
    }

    throw lastError || new Error('Prediction failed after retries');
  }

  // ==========================================================================
  // MODEL INFO
  // ==========================================================================

  /**
   * Get model metadata and information
   */
  async getModelInfo(): Promise<{
    name: string;
    version: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
  }> {
    try {
      const response = await this.client.get('/model/info');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get model info');
    }
  }

  /**
   * Get feature importance
   */
  async getFeatureImportance(): Promise<
    Array<{ feature: string; importance: number }>
  > {
    try {
      const response = await this.client.get('/model/feature-importance');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get feature importance');
    }
  }

  // ==========================================================================
  // PREPROCESSING
  // ==========================================================================

  /**
   * Preprocess raw transaction data
   */
  async preprocess(rawData: unknown): Promise<ProcessedTransaction> {
    try {
      const response = await this.client.post<ProcessedTransaction>(
        '/preprocess',
        rawData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Preprocessing failed');
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown, defaultMessage: string): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      let message = defaultMessage;
      const detail = error.response?.data?.detail;

      if (detail) {
        if (typeof detail === 'string') {
          message = detail;
        } else if (Array.isArray(detail)) {
          // Handle FastAPI validation errors
          message = detail
            .map((e: any) => e.msg || JSON.stringify(e))
            .join(', ');
        } else if (typeof detail === 'object') {
          message = JSON.stringify(detail);
        }
      } else if (error.message) {
        message = error.message;
      }

      return new ApiError(
        message,
        error.response?.status || 500,
        error.response?.data
      );
    }

    if (error instanceof Error) {
      return new ApiError(error.message, 500);
    }

    return new ApiError(defaultMessage, 500);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cancel all pending requests
   */
  cancelAll(): void {
    // Note: In a production app, you'd want to track and cancel specific requests
    console.log('[API] Canceling all pending requests');
  }

  /**
   * Update base URL (useful for switching environments)
   */
  setBaseURL(url: string): void {
    this.client.defaults.baseURL = url;
  }

  /**
   * Get current base URL
   */
  getBaseURL(): string {
    return this.client.defaults.baseURL || API_BASE_URL;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton API client instance
 * Use this throughout the application
 */
export const apiClient = new FraudDetectionApiClient();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick predict function (uses singleton)
 */
export async function predict(
  transaction: ProcessedTransaction
): Promise<PredictionResult> {
  return apiClient.predictSingle(transaction);
}

/**
 * Quick batch predict function (uses singleton)
 */
export async function predictBatch(
  transactions: ProcessedTransaction[]
): Promise<BatchPredictionResponse> {
  return apiClient.predictBatch({ transactions });
}

/**
 * Quick health check function (uses singleton)
 */
export async function checkHealth(): Promise<HealthCheckResponse> {
  return apiClient.healthCheck();
}

/**
 * Check if API is available
 */
export async function isApiAvailable(): Promise<boolean> {
  try {
    await apiClient.healthCheck();
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default apiClient;
