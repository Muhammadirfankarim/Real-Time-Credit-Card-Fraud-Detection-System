/**
 * ONNX Model Configuration
 *
 * Defines model metadata, input/output specs, and configuration
 * for the fraud detection ONNX model.
 */

import { ModelMetadata } from '@/types/transaction';

// ============================================================================
// MODEL METADATA
// ============================================================================

export const FRAUD_MODEL_METADATA: ModelMetadata = {
  name: 'Fraud Detection Model',
  version: '1.0.0',
  type: 'lightgbm',
  format: 'onnx',
  trained_date: '2025-11-28',

  // Performance metrics (from LightGBM training)
  accuracy: 0.9815,
  precision: 0.0777,
  recall: 0.8980,
  f1_score: 0.1431,
  auc: 0.9329,

  // Model specs
  feature_count: 30,
  file_size_mb: 0.032, // LightGBM ONNX size (32 KB)
};

// ============================================================================
// MODEL PATHS
// ============================================================================

export const MODEL_PATHS = {
  // Local development
  local: '/models/fraud_model.onnx',

  // Production (CDN or static hosting)
  production: process.env.NEXT_PUBLIC_MODEL_URL || '/models/fraud_model.onnx',

  // Fallback to scikit-learn model (if ONNX not available)
  fallback: '/models/fraud_model.joblib',
};

// ============================================================================
// MODEL INPUT SPECIFICATION
// ============================================================================

export interface ModelInputSpec {
  name: string;
  shape: number[];
  type: 'float32' | 'float64' | 'int32' | 'int64';
  description: string;
}

export const MODEL_INPUT_SPEC: ModelInputSpec = {
  name: 'float_input', // ONNX input tensor name
  shape: [1, 30], // Batch size 1, 30 features
  type: 'float32',
  description: 'Transaction features: Time, V1-V28, Amount (all scaled)',
};

// Feature names in order
export const FEATURE_NAMES: string[] = [
  'Time',
  'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10',
  'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18', 'V19', 'V20',
  'V21', 'V22', 'V23', 'V24', 'V25', 'V26', 'V27', 'V28',
  'Amount',
];

// ============================================================================
// MODEL OUTPUT SPECIFICATION
// ============================================================================

export interface ModelOutputSpec {
  name: string;
  shape: number[];
  type: 'float32' | 'float64';
  description: string;
  labels: string[];
}

export const MODEL_OUTPUT_SPEC: ModelOutputSpec = {
  name: 'probabilities', // ONNX output tensor name
  shape: [1, 2], // Batch size 1, 2 classes (Normal, Fraud)
  type: 'float32',
  description: 'Probability distribution over classes',
  labels: ['Normal', 'Fraud'],
};

// ============================================================================
// INFERENCE CONFIGURATION
// ============================================================================

export interface InferenceConfig {
  // Execution providers (order matters - first available is used)
  executionProviders: string[];

  // Session options
  sessionOptions: {
    enableCpuMemArena: boolean;
    enableMemPattern: boolean;
    graphOptimizationLevel: 'disabled' | 'basic' | 'extended' | 'all';
    executionMode: 'sequential' | 'parallel';
  };

  // Performance tuning
  performance: {
    enableProfiling: boolean;
    intraOpNumThreads: number;
    interOpNumThreads: number;
  };

  // Caching
  cache: {
    enabled: boolean;
    maxSize: number; // Max cached predictions
  };
}

export const DEFAULT_INFERENCE_CONFIG: InferenceConfig = {
  executionProviders: [
    'wasm', // WebAssembly (most compatible for browser)
    'webgl', // WebGL (if available, faster)
    'cpu', // Fallback
  ],

  sessionOptions: {
    enableCpuMemArena: true,
    enableMemPattern: true,
    graphOptimizationLevel: 'all',
    executionMode: 'sequential',
  },

  performance: {
    enableProfiling: false, // Set to true for debugging
    intraOpNumThreads: 1,
    interOpNumThreads: 1,
  },

  cache: {
    enabled: true,
    maxSize: 100, // Cache last 100 predictions
  },
};

// ============================================================================
// PREDICTION THRESHOLDS
// ============================================================================

export const PREDICTION_THRESHOLDS = {
  // Probability threshold for fraud classification
  fraud: 0.5, // > 0.5 = Fraud

  // Risk levels based on fraud probability
  risk_levels: {
    very_low: 0.1,
    low: 0.3,
    medium: 0.7,
    high: 0.9,
  },

  // Confidence thresholds
  confidence: {
    low: 0.6,
    medium: 0.8,
    high: 0.95,
  },
};

// ============================================================================
// MODEL VALIDATION
// ============================================================================

export interface ValidationRules {
  features: {
    min: number;
    max: number;
  }[];
}

// Validation rules for each feature (based on training data)
export const FEATURE_VALIDATION: Record<string, { min: number; max: number }> = {
  Time: { min: -5, max: 5 }, // Scaled values
  Amount: { min: -5, max: 10 }, // Scaled values (can be large outliers)
  // V1-V28 are PCA-transformed, typically between -10 and 10
  ...Object.fromEntries(
    Array.from({ length: 28 }, (_, i) => [`V${i + 1}`, { min: -10, max: 10 }])
  ),
};

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  MODEL_NOT_LOADED: 'Model has not been loaded. Call loadModel() first.',
  MODEL_LOAD_FAILED: 'Failed to load ONNX model. Check model file exists.',
  INVALID_INPUT_SHAPE: 'Invalid input shape. Expected 30 features.',
  INVALID_INPUT_VALUES: 'Invalid input values. All features must be valid numbers.',
  INFERENCE_FAILED: 'Model inference failed. Check input data.',
  BROWSER_NOT_SUPPORTED: 'Browser does not support WebAssembly or ONNX Runtime.',
  OUT_OF_MEMORY: 'Out of memory. Try reducing batch size.',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get model path based on environment
 */
export function getModelPath(): string {
  if (process.env.NODE_ENV === 'production') {
    return MODEL_PATHS.production;
  }
  return MODEL_PATHS.local;
}

/**
 * Validate feature values
 */
export function validateFeatureValues(features: number[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (features.length !== 30) {
    errors.push(`Expected 30 features, got ${features.length}`);
    return { valid: false, errors };
  }

  features.forEach((value, index) => {
    const featureName = FEATURE_NAMES[index];
    const validation = FEATURE_VALIDATION[featureName];

    if (!validation) return;

    if (value < validation.min || value > validation.max) {
      errors.push(
        `${featureName} value ${value.toFixed(2)} outside valid range [${validation.min}, ${validation.max}]`
      );
    }

    if (!isFinite(value) || isNaN(value)) {
      errors.push(`${featureName} has invalid value: ${value}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get feature index by name
 */
export function getFeatureIndex(featureName: string): number {
  return FEATURE_NAMES.indexOf(featureName);
}

/**
 * Get feature name by index
 */
export function getFeatureName(index: number): string {
  return FEATURE_NAMES[index] || 'Unknown';
}

/**
 * Check if browser supports ONNX Runtime
 */
export function isBrowserSupported(): boolean {
  // Check for WebAssembly support
  if (typeof WebAssembly === 'undefined') {
    return false;
  }

  // Check for required APIs
  if (typeof Float32Array === 'undefined') {
    return false;
  }

  return true;
}

/**
 * Get recommended execution provider for current browser
 */
export function getRecommendedExecutionProvider(): string {
  // Check for WebGL support
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (gl) {
    return 'webgl';
  }

  // Fallback to WebAssembly
  if (typeof WebAssembly !== 'undefined') {
    return 'wasm';
  }

  return 'cpu';
}

/**
 * Estimate memory usage for model
 */
export function estimateMemoryUsage(batchSize: number = 1): {
  modelSize: number; // MB
  inputSize: number; // MB
  outputSize: number; // MB
  total: number; // MB
} {
  const BYTES_PER_FLOAT32 = 4;

  const modelSize = FRAUD_MODEL_METADATA.file_size_mb;
  const inputSize = (batchSize * 30 * BYTES_PER_FLOAT32) / (1024 * 1024);
  const outputSize = (batchSize * 2 * BYTES_PER_FLOAT32) / (1024 * 1024);
  const total = modelSize + inputSize + outputSize;

  return {
    modelSize,
    inputSize,
    outputSize,
    total,
  };
}