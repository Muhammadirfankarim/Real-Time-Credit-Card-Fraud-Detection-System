/**
 * API Endpoint Definitions
 * Centralized endpoint configuration for type-safe API calls
 */

// ============================================================================
// BASE CONFIGURATION
// ============================================================================

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

// ============================================================================
// ENDPOINT DEFINITIONS
// ============================================================================

export const ENDPOINTS = {
  // Health & Status
  health: '/health',
  status: '/status',

  // Prediction
  predict: '/predict',
  predictBatch: '/predict/batch',
  predictStream: '/predict/stream',

  // Model Information
  modelInfo: '/model/info',
  modelMetadata: '/model/metadata',
  modelMetrics: '/model/metrics',
  featureImportance: '/model/feature-importance',
  modelVersion: '/model/version',

  // Preprocessing
  preprocess: '/preprocess',
  preprocessBatch: '/preprocess/batch',
  validateTransaction: '/validate/transaction',

  // Analytics
  analytics: '/analytics',
  analyticsDaily: '/analytics/daily',
  analyticsWeekly: '/analytics/weekly',
  analyticsMonthly: '/analytics/monthly',

  // Statistics
  stats: '/stats',
  statsRecent: '/stats/recent',
  statsTrends: '/stats/trends',

  // Dataset Information
  datasetInfo: '/dataset/info',
  datasetStats: '/dataset/stats',
  datasetSample: '/dataset/sample',
} as const;

// ============================================================================
// ENDPOINT BUILDERS
// ============================================================================

/**
 * Build endpoint URL with parameters
 */
export function buildEndpoint(
  endpoint: string,
  params?: Record<string, string | number>
): string {
  if (!params) return endpoint;

  const query = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  return `${endpoint}?${query}`;
}

/**
 * Build full URL
 */
export function buildFullUrl(endpoint: string): string {
  return `${API_CONFIG.baseURL}${endpoint}`;
}

// ============================================================================
// ENDPOINT HELPERS
// ============================================================================

export const endpointHelpers = {
  /**
   * Get analytics endpoint for specific time range
   */
  getAnalytics(range: 'daily' | 'weekly' | 'monthly'): string {
    switch (range) {
      case 'daily':
        return ENDPOINTS.analyticsDaily;
      case 'weekly':
        return ENDPOINTS.analyticsWeekly;
      case 'monthly':
        return ENDPOINTS.analyticsMonthly;
      default:
        return ENDPOINTS.analytics;
    }
  },

  /**
   * Get stats endpoint with filters
   */
  getStats(filters?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }): string {
    return buildEndpoint(ENDPOINTS.stats, filters as Record<string, string | number>);
  },

  /**
   * Get dataset sample endpoint
   */
  getDatasetSample(params?: { size?: number; fraud?: boolean }): string {
    return buildEndpoint(ENDPOINTS.datasetSample, params as Record<string, string | number>);
  },
};

// ============================================================================
// HTTP METHOD TYPES
// ============================================================================

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];

// ============================================================================
// REQUEST CONFIGURATIONS
// ============================================================================

/**
 * Predefined request configurations for common use cases
 */
export const REQUEST_CONFIGS = {
  // Standard request
  standard: {
    timeout: API_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  },

  // Long-running request (for batch processing)
  longRunning: {
    timeout: 120000, // 2 minutes
    headers: {
      'Content-Type': 'application/json',
    },
  },

  // File upload
  fileUpload: {
    timeout: 60000, // 1 minute
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  },

  // Streaming
  streaming: {
    timeout: 0, // No timeout
    responseType: 'stream' as const,
    headers: {
      'Content-Type': 'application/json',
    },
  },
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  networkError: 'Network error. Please check your connection.',
  timeout: 'Request timeout. Please try again.',
  serverError: 'Server error. Please try again later.',
  unauthorized: 'Unauthorized. Please log in.',
  forbidden: 'Access forbidden.',
  notFound: 'Resource not found.',
  badRequest: 'Invalid request. Please check your input.',
  tooManyRequests: 'Too many requests. Please wait a moment.',
  unknown: 'An unknown error occurred.',
} as const;

// ============================================================================
// STATUS CODES
// ============================================================================

export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 408,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if status code indicates success
 */
export function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * Check if status code indicates client error
 */
export function isClientError(status: number): boolean {
  return status >= 400 && status < 500;
}

/**
 * Check if status code indicates server error
 */
export function isServerError(status: number): boolean {
  return status >= 500;
}

/**
 * Get error message for status code
 */
export function getErrorMessage(status: number): string {
  switch (status) {
    case STATUS_CODES.BAD_REQUEST:
      return ERROR_MESSAGES.badRequest;
    case STATUS_CODES.UNAUTHORIZED:
      return ERROR_MESSAGES.unauthorized;
    case STATUS_CODES.FORBIDDEN:
      return ERROR_MESSAGES.forbidden;
    case STATUS_CODES.NOT_FOUND:
      return ERROR_MESSAGES.notFound;
    case STATUS_CODES.TIMEOUT:
    case STATUS_CODES.GATEWAY_TIMEOUT:
      return ERROR_MESSAGES.timeout;
    case STATUS_CODES.TOO_MANY_REQUESTS:
      return ERROR_MESSAGES.tooManyRequests;
    case STATUS_CODES.INTERNAL_SERVER_ERROR:
    case STATUS_CODES.BAD_GATEWAY:
    case STATUS_CODES.SERVICE_UNAVAILABLE:
      return ERROR_MESSAGES.serverError;
    default:
      if (isServerError(status)) return ERROR_MESSAGES.serverError;
      if (isClientError(status)) return ERROR_MESSAGES.badRequest;
      return ERROR_MESSAGES.unknown;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ENDPOINTS;
