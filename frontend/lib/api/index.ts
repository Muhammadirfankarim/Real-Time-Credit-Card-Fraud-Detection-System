/**
 * API Module - Barrel Exports
 */

export { apiClient, FraudDetectionApiClient, ApiError } from './apiClient';
export type { default as apiClientType } from './apiClient';

export {
  ENDPOINTS,
  API_CONFIG,
  HTTP_METHODS,
  REQUEST_CONFIGS,
  ERROR_MESSAGES,
  STATUS_CODES,
  buildEndpoint,
  buildFullUrl,
  endpointHelpers,
  isSuccessStatus,
  isClientError,
  isServerError,
  getErrorMessage,
} from './endpoints';

export type { HttpMethod } from './endpoints';

// Convenience re-exports
export {
  predict,
  predictBatch,
  checkHealth,
  isApiAvailable,
} from './apiClient';
