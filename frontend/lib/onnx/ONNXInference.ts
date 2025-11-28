/**
 * ONNXInference - Browser-side ML Inference Engine
 *
 * Provides high-level interface for running fraud detection
 * predictions using ONNX Runtime Web in the browser.
 *
 * Features:
 * - Model loading and caching
 * - Single and batch predictions
 * - Performance monitoring
 * - Error handling
 * - Result caching
 */

import * as ort from 'onnxruntime-web';
import { ProcessedTransaction, PredictionResult, RiskLevel } from '@/types/transaction';
import {
  getModelPath,
  validateFeatureValues,
  DEFAULT_INFERENCE_CONFIG,
  FEATURE_NAMES,
  ERROR_MESSAGES,
  PREDICTION_THRESHOLDS,
  isBrowserSupported,
  getRecommendedExecutionProvider,
} from './modelConfig';
import { getRiskLevel } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface InferenceOptions {
  useCache?: boolean;
  returnProbabilities?: boolean;
  returnTimings?: boolean;
}

export interface InferenceResult extends PredictionResult {
  // Additional metadata
  timings?: {
    preprocessMs: number;
    inferenceMs: number;
    postprocessMs: number;
    totalMs: number;
  };
  cached?: boolean;
}

interface CacheEntry {
  input: string; // Stringified input for comparison
  result: InferenceResult;
  timestamp: number;
}

// ============================================================================
// ONNX INFERENCE CLASS
// ============================================================================

export class ONNXInference {
  private session: ort.InferenceSession | null = null;
  private isModelLoaded: boolean = false;
  private modelPath: string;
  private cache: Map<string, CacheEntry> = new Map();
  private maxCacheSize: number = 100;

  // Performance stats
  private stats = {
    totalPredictions: 0,
    totalInferenceTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  constructor(modelPath?: string) {
    this.modelPath = modelPath || getModelPath();

    // Check browser support
    if (!isBrowserSupported()) {
      console.warn('Browser does not fully support ONNX Runtime Web');
    }
  }

  /**
   * Load ONNX model from file
   */
  async loadModel(): Promise<void> {
    if (this.isModelLoaded) {
      console.log('Model already loaded');
      return;
    }

    try {
      console.log(`Loading ONNX model from: ${this.modelPath}`);

      // Configure ONNX Runtime
      const executionProvider = getRecommendedExecutionProvider();
      console.log(`Using execution provider: ${executionProvider}`);

      // Create inference session
      this.session = await ort.InferenceSession.create(this.modelPath, {
        executionProviders: [executionProvider],
        graphOptimizationLevel: 'all',
        enableCpuMemArena: true,
        enableMemPattern: true,
      });

      this.isModelLoaded = true;
      console.log('✅ ONNX model loaded successfully');

      // Log model info
      console.log('Model inputs:', this.session.inputNames);
      console.log('Model outputs:', this.session.outputNames);
    } catch (error) {
      console.error('❌ Failed to load ONNX model:', error);
      throw new Error(`${ERROR_MESSAGES.MODEL_LOAD_FAILED}: ${error}`);
    }
  }

  /**
   * Predict fraud for a single transaction
   */
  async predict(
    transaction: ProcessedTransaction,
    options: InferenceOptions = {}
  ): Promise<InferenceResult> {
    const startTime = performance.now();

    // Check if model is loaded
    if (!this.isModelLoaded || !this.session) {
      throw new Error(ERROR_MESSAGES.MODEL_NOT_LOADED);
    }

    // Check cache
    if (options.useCache !== false) {
      const cached = this.getFromCache(transaction);
      if (cached) {
        this.stats.cacheHits++;
        return { ...cached, cached: true };
      }
    }
    this.stats.cacheMisses++;

    // Preprocess: Convert transaction to feature array
    const preprocessStart = performance.now();
    const features = this.transactionToFeatures(transaction);
    const preprocessTime = performance.now() - preprocessStart;

    // Validate features
    const validation = validateFeatureValues(features);
    if (!validation.valid) {
      throw new Error(`${ERROR_MESSAGES.INVALID_INPUT_VALUES}\n${validation.errors.join('\n')}`);
    }

    // Run inference
    const inferenceStart = performance.now();
    const probabilities = await this.runInference(features);
    const inferenceTime = performance.now() - inferenceStart;

    // Postprocess: Convert probabilities to prediction result
    const postprocessStart = performance.now();
    const result = this.postprocess(probabilities);
    const postprocessTime = performance.now() - postprocessStart;

    const totalTime = performance.now() - startTime;

    // Update stats
    this.stats.totalPredictions++;
    this.stats.totalInferenceTime += inferenceTime;

    // Build result
    const inferenceResult: InferenceResult = {
      ...result,
      processing_time_ms: totalTime,
      model_version: '1.0.0',
      cached: false,
    };

    // Add timings if requested
    if (options.returnTimings) {
      inferenceResult.timings = {
        preprocessMs: preprocessTime,
        inferenceMs: inferenceTime,
        postprocessMs: postprocessTime,
        totalMs: totalTime,
      };
    }

    // Cache result
    if (options.useCache !== false) {
      this.addToCache(transaction, inferenceResult);
    }

    return inferenceResult;
  }

  /**
   * Predict fraud for multiple transactions (batch)
   */
  async predictBatch(
    transactions: ProcessedTransaction[],
    options: InferenceOptions = {}
  ): Promise<InferenceResult[]> {
    const results: InferenceResult[] = [];

    // Process each transaction
    // Note: We process sequentially for now
    // In production, could optimize with actual batch inference
    for (const transaction of transactions) {
      const result = await this.predict(transaction, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Convert ProcessedTransaction to feature array
   */
  private transactionToFeatures(transaction: ProcessedTransaction): number[] {
    const features: number[] = [];

    for (const featureName of FEATURE_NAMES) {
      const value = transaction[featureName as keyof ProcessedTransaction];

      if (typeof value !== 'number') {
        throw new Error(`Missing or invalid feature: ${featureName}`);
      }

      features.push(value);
    }

    return features;
  }

  /**
   * Run ONNX inference
   */
  private async runInference(features: number[]): Promise<number[]> {
    if (!this.session) {
      throw new Error(ERROR_MESSAGES.MODEL_NOT_LOADED);
    }

    try {
      // Create tensor from features
      const inputTensor = new ort.Tensor('float32', new Float32Array(features), [1, 30]);

      // Get input name (may vary by model)
      const inputName = this.session.inputNames[0];

      // Run inference
      const feeds: Record<string, ort.Tensor> = {};
      feeds[inputName] = inputTensor;

      const results = await this.session.run(feeds);

      // Get output tensor
      const outputName = this.session.outputNames[0];
      const outputTensor = results[outputName];

      // Extract probabilities
      // Output shape is [1, 2] for [P(Normal), P(Fraud)]
      const probabilities = Array.from(outputTensor.data as Float32Array);

      return probabilities;
    } catch (error) {
      console.error('Inference error:', error);
      throw new Error(`${ERROR_MESSAGES.INFERENCE_FAILED}: ${error}`);
    }
  }

  /**
   * Convert model output to PredictionResult
   */
  private postprocess(probabilities: number[]): PredictionResult {
    // probabilities = [P(Normal), P(Fraud)]
    const probNormal = probabilities[0];
    const probFraud = probabilities[1];

    // Determine prediction
    const prediction: 'Fraud' | 'Normal' =
      probFraud > PREDICTION_THRESHOLDS.fraud ? 'Fraud' : 'Normal';

    // Confidence is the max probability
    const confidenceScore = Math.max(probNormal, probFraud);

    // Determine risk level
    const riskLevel = getRiskLevel(probFraud);

    return {
      prediction,
      confidence_score: confidenceScore,
      probability_fraud: probFraud,
      probability_normal: probNormal,
      risk_level: riskLevel,
    };
  }

  /**
   * Get cached prediction
   */
  private getFromCache(transaction: ProcessedTransaction): InferenceResult | null {
    const key = this.getCacheKey(transaction);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if cache entry is still valid (e.g., < 1 hour old)
    const maxAge = 60 * 60 * 1000; // 1 hour
    if (Date.now() - entry.timestamp > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  /**
   * Add prediction to cache
   */
  private addToCache(transaction: ProcessedTransaction, result: InferenceResult): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const key = this.getCacheKey(transaction);
    this.cache.set(key, {
      input: key,
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Generate cache key from transaction
   */
  private getCacheKey(transaction: ProcessedTransaction): string {
    // Use first few features for key (Time, V1, V2, Amount)
    const keyFeatures = [transaction.Time, transaction.V1, transaction.V2, transaction.Amount];
    return keyFeatures.map((v) => v.toFixed(4)).join('_');
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    totalPredictions: number;
    avgInferenceTime: number;
    cacheHitRate: number;
    cacheSize: number;
  } {
    const avgInferenceTime =
      this.stats.totalPredictions > 0
        ? this.stats.totalInferenceTime / this.stats.totalPredictions
        : 0;

    const totalCacheRequests = this.stats.cacheHits + this.stats.cacheMisses;
    const cacheHitRate = totalCacheRequests > 0 ? this.stats.cacheHits / totalCacheRequests : 0;

    return {
      totalPredictions: this.stats.totalPredictions,
      avgInferenceTime,
      cacheHitRate,
      cacheSize: this.cache.size,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalPredictions: 0,
      totalInferenceTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * Check if model is loaded
   */
  isLoaded(): boolean {
    return this.isModelLoaded;
  }

  /**
   * Dispose model and free memory
   */
  async dispose(): Promise<void> {
    if (this.session) {
      // ONNX Runtime Web doesn't have explicit dispose
      // But we can clear references
      this.session = null;
      this.isModelLoaded = false;
      this.clearCache();
      console.log('Model disposed');
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let inferenceInstance: ONNXInference | null = null;

/**
 * Get singleton instance of ONNX Inference
 */
export function getInferenceInstance(): ONNXInference {
  if (!inferenceInstance) {
    inferenceInstance = new ONNXInference();
  }
  return inferenceInstance;
}

/**
 * Initialize and load model (singleton)
 */
export async function initializeModel(): Promise<void> {
  const instance = getInferenceInstance();
  if (!instance.isLoaded()) {
    await instance.loadModel();
  }
}

/**
 * Quick predict function (uses singleton)
 */
export async function quickPredict(
  transaction: ProcessedTransaction
): Promise<PredictionResult> {
  const instance = getInferenceInstance();

  // Auto-load model if not loaded
  if (!instance.isLoaded()) {
    await instance.loadModel();
  }

  return await instance.predict(transaction);
}