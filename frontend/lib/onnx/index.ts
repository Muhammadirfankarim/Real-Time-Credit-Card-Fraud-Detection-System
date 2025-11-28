/**
 * ONNX Module - Barrel Export
 *
 * Central export point for ONNX Runtime inference utilities.
 */

// Main inference class
export {
  ONNXInference,
  getInferenceInstance,
  initializeModel,
  quickPredict,
  type InferenceOptions,
  type InferenceResult,
} from './ONNXInference';

// Model configuration
export {
  FRAUD_MODEL_METADATA,
  MODEL_PATHS,
  FEATURE_NAMES,
  PREDICTION_THRESHOLDS,
  DEFAULT_INFERENCE_CONFIG,
  ERROR_MESSAGES,
  getModelPath,
  validateFeatureValues,
  getFeatureIndex,
  getFeatureName,
  isBrowserSupported,
  getRecommendedExecutionProvider,
  estimateMemoryUsage,
  type ModelInputSpec,
  type ModelOutputSpec,
  type InferenceConfig,
} from './modelConfig';