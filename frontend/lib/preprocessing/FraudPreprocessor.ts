/**
 * FraudPreprocessor - Main Preprocessing Pipeline
 *
 * Orchestrates all preprocessing steps to convert raw transaction data
 * into the format required by the fraud detection ML model.
 *
 * Pipeline:
 * 1. Raw Transaction → Feature Extraction
 * 2. Feature Engineering (Temporal, Amount, Risk)
 * 3. Scaling/Normalization
 * 4. Format for Model Input (30 features)
 */

import {
  RawTransaction,
  ProcessedTransaction,
  TemporalFeatures,
  AmountFeatures,
  RiskIndicators,
} from '@/types/transaction';
import { StandardScaler, createPretrainedScaler } from './Scaler';
import { TemporalFeatureExtractor } from './TemporalFeatures';
import { AmountFeatureExtractor } from './AmountFeatures';
import { RiskIndicatorCalculator } from './RiskIndicators';
import { SAMPLE_NORMAL } from '@/lib/utils/sampleData';

export interface PreprocessingResult {
  // Final model input (30 features)
  modelInput: ProcessedTransaction;

  // Extracted features (for analysis/debugging)
  features: {
    temporal: TemporalFeatures;
    amount: AmountFeatures;
    risk: RiskIndicators;
  };

  // Metadata
  metadata: {
    processingTimeMs: number;
    isRawInput: boolean;
    hasAllFeatures: boolean;
  };
}

export class FraudPreprocessor {
  private scaler: StandardScaler;
  private temporalExtractor: TemporalFeatureExtractor;
  private amountExtractor: AmountFeatureExtractor;
  private riskCalculator: RiskIndicatorCalculator;

  constructor() {
    this.scaler = createPretrainedScaler();
    this.temporalExtractor = new TemporalFeatureExtractor();
    this.amountExtractor = new AmountFeatureExtractor();
    this.riskCalculator = new RiskIndicatorCalculator();
  }

  /**
   * Main preprocessing function
   * Accepts either raw transaction or already-processed transaction
   */
  async preprocess(
    input: RawTransaction | ProcessedTransaction
  ): Promise<PreprocessingResult> {
    const startTime = performance.now();

    // Check if input is already processed
    const isRawInput = this.isRawTransaction(input);

    let modelInput: ProcessedTransaction;
    let temporal: TemporalFeatures | null = null;
    let amount: AmountFeatures | null = null;
    let risk: RiskIndicators | null = null;

    if (isRawInput) {
      // Process raw transaction
      const raw = input as RawTransaction;

      // Extract features
      temporal = this.temporalExtractor.extract(raw.timestamp);
      amount = this.amountExtractor.extract(raw.amount);
      risk = this.riskCalculator.calculate(raw);

      // Convert to model input format
      modelInput = await this.convertToModelInput(raw, temporal, amount);
    } else {
      // Already processed, just pass through
      modelInput = input as ProcessedTransaction;
    }

    const processingTimeMs = performance.now() - startTime;

    return {
      modelInput,
      features: {
        temporal: temporal || {
          hour: 0,
          day_of_week: 0,
          is_weekend: false,
          is_night: false,
          is_business_hours: false,
          seconds_from_first: 0,
        },
        amount: amount || {
          raw: 0,
          log_amount: 0,
          scaled_amount: 0,
          decimal_places: 0,
          is_round: false,
          is_large: false,
        },
        risk: risk || {
          is_high_risk_country: false,
          is_online: false,
          is_new_merchant: false,
          is_new_country: false,
          is_high_amount: false,
          is_unusual_hour: false,
          is_velocity_spike: false,
          is_amount_spike: false,
        },
      },
      metadata: {
        processingTimeMs,
        isRawInput,
        hasAllFeatures: this.hasAllRequiredFeatures(modelInput),
      },
    };
  }

  /**
   * Convert raw transaction to model input format
   *
   * The model expects exactly 30 features:
   * - Time (scaled)
   * - V1 through V28 (PCA-transformed, already normalized)
   * - Amount (scaled)
   */
  private async convertToModelInput(
    raw: RawTransaction,
    temporal: TemporalFeatures,
    amount: AmountFeatures
  ): Promise<ProcessedTransaction> {
    // For demo purposes, when we don't have actual PCA transformation,
    // we use default V1-V28 values from a normal transaction
    // In production, you would:
    // 1. Have actual PCA transformation matrix
    // 2. Transform raw features → V1-V28
    // 3. Or use the raw features if model is retrained without PCA

    const defaultVFeatures = this.getDefaultVFeatures();

    // Scale Time and Amount
    const scaledTime = this.scaler.transformSingle('Time', temporal.seconds_from_first);
    const scaledAmount = amount.scaled_amount;

    return {
      Time: scaledTime,
      ...defaultVFeatures,
      Amount: scaledAmount,
    };
  }

  /**
   * Get default V1-V28 features
   * In production, these would come from PCA transformation
   */
  private getDefaultVFeatures(): Omit<ProcessedTransaction, 'Time' | 'Amount'> {
    // Use normal transaction as baseline
    const { Time, Amount, ...vFeatures } = SAMPLE_NORMAL;
    return vFeatures;
  }

  /**
   * Check if input is raw transaction (vs already processed)
   */
  private isRawTransaction(
    input: RawTransaction | ProcessedTransaction
  ): input is RawTransaction {
    // Raw transactions have 'timestamp' field
    // Processed transactions have 'V1', 'V2', etc.
    return 'timestamp' in input && !('V1' in input);
  }

  /**
   * Validate that model input has all required features
   */
  private hasAllRequiredFeatures(input: ProcessedTransaction): boolean {
    const requiredFeatures = [
      'Time',
      'V1',
      'V2',
      'V3',
      'V4',
      'V5',
      'V6',
      'V7',
      'V8',
      'V9',
      'V10',
      'V11',
      'V12',
      'V13',
      'V14',
      'V15',
      'V16',
      'V17',
      'V18',
      'V19',
      'V20',
      'V21',
      'V22',
      'V23',
      'V24',
      'V25',
      'V26',
      'V27',
      'V28',
      'Amount',
    ];

    return requiredFeatures.every((feature) => {
      return feature in input && this.isValidNumber(input[feature as keyof ProcessedTransaction]);
    });
  }

  /**
   * Validate number
   */
  private isValidNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  /**
   * Batch preprocessing for multiple transactions
   */
  async preprocessBatch(
    transactions: (RawTransaction | ProcessedTransaction)[]
  ): Promise<PreprocessingResult[]> {
    const results: PreprocessingResult[] = [];

    for (const transaction of transactions) {
      const result = await this.preprocess(transaction);
      results.push(result);
    }

    return results;
  }

  /**
   * Get preprocessing statistics
   */
  getStatistics(results: PreprocessingResult[]): {
    totalProcessed: number;
    avgProcessingTime: number;
    rawInputCount: number;
    processedInputCount: number;
    validFeaturesCount: number;
  } {
    const totalProcessed = results.length;
    const avgProcessingTime =
      results.reduce((sum, r) => sum + r.metadata.processingTimeMs, 0) / totalProcessed;
    const rawInputCount = results.filter((r) => r.metadata.isRawInput).length;
    const processedInputCount = totalProcessed - rawInputCount;
    const validFeaturesCount = results.filter((r) => r.metadata.hasAllFeatures).length;

    return {
      totalProcessed,
      avgProcessingTime,
      rawInputCount,
      processedInputCount,
      validFeaturesCount,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Quick preprocess a single transaction
 */
export async function preprocessTransaction(
  input: RawTransaction | ProcessedTransaction
): Promise<ProcessedTransaction> {
  const preprocessor = new FraudPreprocessor();
  const result = await preprocessor.preprocess(input);
  return result.modelInput;
}

/**
 * Quick preprocess batch of transactions
 */
export async function preprocessBatch(
  transactions: (RawTransaction | ProcessedTransaction)[]
): Promise<ProcessedTransaction[]> {
  const preprocessor = new FraudPreprocessor();
  const results = await preprocessor.preprocessBatch(transactions);
  return results.map((r) => r.modelInput);
}

/**
 * Preprocess and get full analysis
 */
export async function preprocessWithAnalysis(
  input: RawTransaction
): Promise<PreprocessingResult> {
  const preprocessor = new FraudPreprocessor();
  return await preprocessor.preprocess(input);
}

/**
 * Validate transaction before preprocessing
 */
export function validateTransaction(
  input: RawTransaction | ProcessedTransaction
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if ('timestamp' in input) {
    // Raw transaction validation
    const raw = input as RawTransaction;

    if (!raw.timestamp) {
      errors.push('Missing timestamp');
    }

    if (typeof raw.amount !== 'number' || raw.amount < 0) {
      errors.push('Invalid amount');
    }

    if (raw.amount > 100000) {
      errors.push('Amount exceeds reasonable limit');
    }
  } else {
    // Processed transaction validation
    const processed = input as ProcessedTransaction;

    const requiredFeatures = ['Time', 'V1', 'Amount'];

    for (const feature of requiredFeatures) {
      if (!(feature in processed)) {
        errors.push(`Missing feature: ${feature}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
