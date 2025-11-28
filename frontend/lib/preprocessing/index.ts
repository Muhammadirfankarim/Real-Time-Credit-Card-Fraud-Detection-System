/**
 * Preprocessing Module - Barrel Export
 *
 * Central export point for all preprocessing utilities.
 */

// Main preprocessor
export {
  FraudPreprocessor,
  preprocessTransaction,
  preprocessBatch,
  preprocessWithAnalysis,
  validateTransaction,
  type PreprocessingResult,
} from './FraudPreprocessor';

// Scaler
export {
  StandardScaler,
  createPretrainedScaler,
  quickScale,
  quickInverseScale,
  type ScalerParams,
} from './Scaler';

// Temporal features
export {
  TemporalFeatureExtractor,
  extractTemporalFeatures,
  isHighRiskTime,
  getTemporalRiskScore,
  getTemporalRiskDescription,
  formatTimestamp,
} from './TemporalFeatures';

// Amount features
export {
  AmountFeatureExtractor,
  extractAmountFeatures,
  isSuspiciousAmount,
  getAmountRiskDescription,
  formatAmount,
  isValidAmount,
  getAmountStatistics,
  compareWithDataset,
} from './AmountFeatures';

// Risk indicators
export {
  RiskIndicatorCalculator,
  calculateRiskIndicators,
  hasRiskFlags,
  getRiskLevelFromIndicators,
  getRiskReport,
  isValidCountryCode,
  getCountryRiskCategory,
  getChannelRiskScore,
  isHighRiskMerchantCategory,
} from './RiskIndicators';
