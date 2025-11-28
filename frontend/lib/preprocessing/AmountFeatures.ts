/**
 * AmountFeatures - Transaction Amount Feature Extraction
 *
 * Extracts features from transaction amounts for fraud detection.
 * Amount patterns are crucial fraud indicators:
 * - Round numbers are suspicious (e.g., $1000 vs $1023.47)
 * - Very large amounts need review
 * - Amounts deviating from user's normal pattern are suspicious
 */

import { AmountFeatures } from '@/types/transaction';
import { StandardScaler, createPretrainedScaler } from './Scaler';

// Dataset statistics from creditcard.csv
const AMOUNT_MEAN = 88.349619;
const AMOUNT_STD = 250.120109;
const AMOUNT_MIN = 0.0;
const AMOUNT_MAX = 25691.16;

// Percentiles (from training data)
const AMOUNT_P50 = 22.0; // Median
const AMOUNT_P75 = 77.165; // 75th percentile
const AMOUNT_P90 = 263.15; // 90th percentile
const AMOUNT_P95 = 394.64; // 95th percentile
const AMOUNT_P99 = 1232.93; // 99th percentile

export class AmountFeatureExtractor {
  private scaler: StandardScaler;

  constructor() {
    this.scaler = createPretrainedScaler();
  }

  /**
   * Extract all amount-related features
   */
  extract(amount: number, userAverage?: number, userStd?: number): AmountFeatures {
    return {
      raw: amount,
      log_amount: this.logTransform(amount),
      scaled_amount: this.scaleAmount(amount),
      decimal_places: this.getDecimalPlaces(amount),
      is_round: this.isRoundNumber(amount),
      is_large: this.isLargeAmount(amount),
    };
  }

  /**
   * Log transformation: log(amount + 1)
   * Helps handle outliers and skewed distribution
   */
  private logTransform(amount: number): number {
    return Math.log(amount + 1);
  }

  /**
   * Scale amount using z-score normalization
   */
  private scaleAmount(amount: number): number {
    return this.scaler.transformSingle('Amount', amount);
  }

  /**
   * Get number of decimal places
   * Round numbers (0 decimals) are more suspicious
   */
  private getDecimalPlaces(amount: number): number {
    if (amount === Math.floor(amount)) return 0;

    const amountStr = amount.toString();
    const decimalIndex = amountStr.indexOf('.');

    if (decimalIndex === -1) return 0;

    return amountStr.length - decimalIndex - 1;
  }

  /**
   * Check if amount is a round number
   * Fraudsters often use round numbers (e.g., $500, $1000)
   */
  public isRoundNumber(amount: number): boolean {
    // Check if no decimal places AND divisible by 10
    return amount % 1 === 0 && amount % 10 === 0;
  }

  /**
   * Check if amount is unusually large
   * Above 95th percentile is considered large
   */
  public isLargeAmount(amount: number): boolean {
    return amount > AMOUNT_P95;
  }

  /**
   * Get amount percentile rank (0-100)
   */
  getPercentileRank(amount: number): number {
    if (amount <= AMOUNT_P50) {
      return (amount / AMOUNT_P50) * 50;
    } else if (amount <= AMOUNT_P75) {
      return 50 + ((amount - AMOUNT_P50) / (AMOUNT_P75 - AMOUNT_P50)) * 25;
    } else if (amount <= AMOUNT_P90) {
      return 75 + ((amount - AMOUNT_P75) / (AMOUNT_P90 - AMOUNT_P75)) * 15;
    } else if (amount <= AMOUNT_P95) {
      return 90 + ((amount - AMOUNT_P90) / (AMOUNT_P95 - AMOUNT_P90)) * 5;
    } else if (amount <= AMOUNT_P99) {
      return 95 + ((amount - AMOUNT_P95) / (AMOUNT_P99 - AMOUNT_P95)) * 4;
    } else {
      return Math.min(99 + (amount - AMOUNT_P99) / (AMOUNT_MAX - AMOUNT_P99), 100);
    }
  }

  /**
   * Calculate deviation from user's average amount
   * Requires user's transaction history
   */
  calculateDeviation(amount: number, userAverage: number, userStd: number): number {
    if (userStd === 0) return 0;
    return Math.abs((amount - userAverage) / userStd);
  }

  /**
   * Check if amount deviates significantly from user's normal pattern
   * > 3 standard deviations is very unusual
   */
  isUnusualForUser(amount: number, userAverage: number, userStd: number): boolean {
    const deviation = this.calculateDeviation(amount, userAverage, userStd);
    return deviation > 3; // More than 3 sigma
  }

  // ========================================================================
  // AMOUNT RISK SCORING
  // ========================================================================

  /**
   * Calculate fraud risk score based on amount (0-1)
   * Higher score = higher risk
   */
  getAmountRiskScore(amount: number, userAverage?: number, userStd?: number): number {
    let riskScore = 0.0;

    // Large amount (> 95th percentile) +0.3
    if (this.isLargeAmount(amount)) {
      riskScore += 0.3;
    }

    // Round number +0.2
    if (this.isRoundNumber(amount)) {
      riskScore += 0.2;
    }

    // Very round number (divisible by 100) +0.1
    if (amount % 100 === 0 && amount > 0) {
      riskScore += 0.1;
    }

    // Unusual for user (if history available)
    if (userAverage !== undefined && userStd !== undefined) {
      if (this.isUnusualForUser(amount, userAverage, userStd)) {
        riskScore += 0.4;
      }
    }

    return Math.min(riskScore, 1.0); // Cap at 1.0
  }

  /**
   * Get human-readable amount category
   */
  getAmountCategory(amount: number): string {
    if (amount <= AMOUNT_P50) return 'Small';
    if (amount <= AMOUNT_P75) return 'Medium';
    if (amount <= AMOUNT_P90) return 'Large';
    if (amount <= AMOUNT_P95) return 'Very Large';
    return 'Extremely Large';
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Quick extract amount features
 */
export function extractAmountFeatures(amount: number): AmountFeatures {
  const extractor = new AmountFeatureExtractor();
  return extractor.extract(amount);
}

/**
 * Check if amount is suspicious
 */
export function isSuspiciousAmount(amount: number): boolean {
  const extractor = new AmountFeatureExtractor();

  // Suspicious if:
  // 1. Very large (> 95th percentile)
  // 2. Round number AND large
  return extractor.isLargeAmount(amount) || (extractor.isRoundNumber(amount) && amount > 1000);
}

/**
 * Get amount risk description
 */
export function getAmountRiskDescription(amount: number): string {
  const extractor = new AmountFeatureExtractor();
  const risks: string[] = [];

  if (extractor.isLargeAmount(amount)) {
    risks.push(`Large amount (>${AMOUNT_P95.toFixed(2)})`);
  }

  if (extractor.isRoundNumber(amount)) {
    risks.push('Round number');
  }

  if (amount % 100 === 0 && amount >= 100) {
    risks.push('Very round number (divisible by 100)');
  }

  const percentile = extractor.getPercentileRank(amount);
  if (percentile >= 99) {
    risks.push('Top 1% of all transactions');
  }

  if (risks.length === 0) {
    return 'Normal transaction amount';
  }

  return risks.join(', ');
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Validate amount
 */
export function isValidAmount(amount: number): boolean {
  return (
    typeof amount === 'number' &&
    !isNaN(amount) &&
    isFinite(amount) &&
    amount >= 0 &&
    amount <= AMOUNT_MAX * 2 // Allow up to 2x max for edge cases
  );
}

/**
 * Get amount statistics
 */
export function getAmountStatistics() {
  return {
    mean: AMOUNT_MEAN,
    std: AMOUNT_STD,
    min: AMOUNT_MIN,
    max: AMOUNT_MAX,
    median: AMOUNT_P50,
    percentiles: {
      p50: AMOUNT_P50,
      p75: AMOUNT_P75,
      p90: AMOUNT_P90,
      p95: AMOUNT_P95,
      p99: AMOUNT_P99,
    },
  };
}

/**
 * Compare amount with dataset statistics
 */
export function compareWithDataset(amount: number): {
  percentile: number;
  category: string;
  comparisonText: string;
} {
  const extractor = new AmountFeatureExtractor();
  const percentile = extractor.getPercentileRank(amount);
  const category = extractor.getAmountCategory(amount);

  let comparisonText = '';
  if (percentile < 50) {
    comparisonText = `This amount is lower than ${(100 - percentile).toFixed(0)}% of transactions`;
  } else {
    comparisonText = `This amount is higher than ${percentile.toFixed(0)}% of transactions`;
  }

  return {
    percentile,
    category,
    comparisonText,
  };
}
