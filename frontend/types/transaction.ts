/**
 * Transaction Types for Fraud Detection System
 *
 * Defines all interfaces for raw transactions, processed transactions,
 * predictions, and API responses.
 */

// ============================================================================
// RAW TRANSACTION (Input dari user/payment gateway)
// ============================================================================

export interface RawTransaction {
  // Basic Information
  transaction_id?: string;
  timestamp: string | Date;
  amount: number; // Raw amount (e.g., 150.50 USD)

  // Card Information (optional, privacy-sensitive)
  card_number_hash?: string;
  card_type?: 'credit' | 'debit' | 'prepaid';

  // Location & Merchant
  merchant_category?: string; // e.g., "Retail", "Online", "Restaurant"
  merchant_id?: string;
  country_code?: string; // ISO 3166-1 alpha-2 (e.g., "US", "ID")
  city?: string;

  // Channel & Device
  channel?: 'online' | 'pos' | 'atm' | 'mobile';
  device_fingerprint?: string;
  ip_address?: string;

  // Customer Information (optional)
  customer_id?: string;
  customer_age?: number;
  customer_account_age_days?: number;
}

// ============================================================================
// PROCESSED TRANSACTION (Format untuk model ML)
// ============================================================================

export interface ProcessedTransaction {
  Time: number; // Scaled time (seconds from first transaction)
  V1: number;
  V2: number;
  V3: number;
  V4: number;
  V5: number;
  V6: number;
  V7: number;
  V8: number;
  V9: number;
  V10: number;
  V11: number;
  V12: number;
  V13: number;
  V14: number;
  V15: number;
  V16: number;
  V17: number;
  V18: number;
  V19: number;
  V20: number;
  V21: number;
  V22: number;
  V23: number;
  V24: number;
  V25: number;
  V26: number;
  V27: number;
  V28: number;
  Amount: number; // Scaled amount
}

// ============================================================================
// TEMPORAL FEATURES (Extracted from timestamp)
// ============================================================================

export interface TemporalFeatures {
  hour: number; // 0-23
  day_of_week: number; // 0-6 (0 = Sunday)
  is_weekend: boolean;
  is_night: boolean; // 22:00 - 06:00
  is_business_hours: boolean; // 09:00 - 17:00
  seconds_from_first: number; // Time delta from reference point
}

// ============================================================================
// AMOUNT FEATURES (Extracted from transaction amount)
// ============================================================================

export interface AmountFeatures {
  raw: number;
  log_amount: number; // log(amount + 1)
  scaled_amount: number; // z-score normalized
  decimal_places: number; // Number of decimal places
  is_round: boolean; // No decimal places (potential fraud indicator)
  is_large: boolean; // > 95th percentile
}

// ============================================================================
// HISTORICAL FEATURES (From customer transaction history)
// ============================================================================

export interface HistoricalFeatures {
  tx_count_1h: number; // Transactions in last 1 hour
  tx_count_24h: number; // Transactions in last 24 hours
  tx_count_7d: number; // Transactions in last 7 days
  velocity: number; // Transactions per hour
  avg_amount: number; // Average transaction amount
  std_amount: number; // Standard deviation of amount
  time_since_last_tx: number; // Seconds since last transaction
  amount_deviation: number; // How much current amount deviates from average
}

// ============================================================================
// RISK INDICATORS (Binary fraud indicators)
// ============================================================================

export interface RiskIndicators {
  is_high_risk_country: boolean;
  is_online: boolean;
  is_new_merchant: boolean;
  is_new_country: boolean;
  is_high_amount: boolean;
  is_unusual_hour: boolean;
  is_velocity_spike: boolean; // Sudden increase in transaction frequency
  is_amount_spike: boolean; // Unusual amount compared to history
}

// ============================================================================
// PREDICTION RESULT
// ============================================================================

export interface PredictionResult {
  prediction: 'Fraud' | 'Normal';
  confidence_score: number; // 0-1
  probability_fraud: number; // 0-1
  probability_normal: number; // 0-1
  risk_level: RiskLevel;
  processing_time_ms?: number;
  model_version?: string;
}

export type RiskLevel = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface RiskLevelConfig {
  color: string;
  message: string;
  action: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiHealthResponse {
  status: 'healthy' | 'unhealthy';
  message: string;
  model_loaded: boolean;
  scaler_loaded: boolean;
  uptime?: number;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  detail?: string;
  status_code?: number;
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

export interface BatchPredictionRequest {
  transactions: (RawTransaction | ProcessedTransaction)[];
  include_features?: boolean; // Return engineered features
}

export interface BatchPredictionResult {
  transaction_id?: string;
  index: number;
  prediction: 'Fraud' | 'Normal';
  confidence_score: number;
  probability_fraud: number;
  probability_normal: number;
  risk_level: RiskLevel;
  actual_label?: 'Fraud' | 'Normal'; // If ground truth available
  is_correct?: boolean; // If ground truth available
}

export interface BatchAnalysisResult {
  total: number;
  fraud_count: number;
  normal_count: number;
  accuracy?: number; // If ground truth available
  precision?: number;
  recall?: number;
  f1_score?: number;
  confusion_matrix?: ConfusionMatrix;
  results: BatchPredictionResult[];
}

export interface ConfusionMatrix {
  tp: number; // True Positive
  tn: number; // True Negative
  fp: number; // False Positive
  fn: number; // False Negative
}

// ============================================================================
// DASHBOARD METRICS
// ============================================================================

export interface DashboardMetrics {
  total_transactions: number;
  fraud_detected: number;
  fraud_rate: number; // Percentage
  avg_confidence: number;
  processing_speed: number; // Transactions per second
  false_positive_rate?: number;
  last_updated: Date;
}

export interface TransactionHistoryItem {
  id: string;
  timestamp: Date;
  amount: number;
  prediction: 'Fraud' | 'Normal';
  confidence: number;
  risk_level: RiskLevel;
  merchant?: string;
  country?: string;
}

// ============================================================================
// PREPROCESSING CONFIG
// ============================================================================

export interface PreprocessingConfig {
  scaler: {
    mean: Record<string, number>;
    std: Record<string, number>;
  };
  pca?: {
    components: number[][];
    explained_variance: number[];
  };
  feature_names: string[];
  high_risk_countries: string[];
  high_risk_merchants: string[];
  version: string;
}

// ============================================================================
// MODEL METADATA
// ============================================================================

export interface ModelMetadata {
  name: string;
  version: string;
  type: 'lightgbm' | 'xgboost' | 'randomforest' | 'logistic';
  format: 'onnx' | 'pkl' | 'joblib';
  trained_date: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc: number;
  feature_count: number;
  file_size_mb: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const RISK_LEVEL_CONFIG: Record<RiskLevel, RiskLevelConfig> = {
  VERY_LOW: {
    color: '#22c55e',
    message: 'Very Safe Transaction',
    action: 'Automatic processing',
  },
  LOW: {
    color: '#86efac',
    message: 'Safe Transaction',
    action: 'Automatic processing',
  },
  MEDIUM: {
    color: '#fb923c',
    message: 'Requires Attention',
    action: 'Manual review recommended',
  },
  HIGH: {
    color: '#ef4444',
    message: 'High Risk',
    action: 'Block and investigate',
  },
  VERY_HIGH: {
    color: '#b91c1c',
    message: 'Very Dangerous',
    action: 'Block immediately',
  },
};

export const FEATURE_EXPLANATIONS: Record<string, string> = {
  Time: 'Transaction time (seconds since first transaction)',
  Amount: 'Transaction amount in local currency',
  'V1-V28': 'Encrypted security features (PCA-transformed sensitive data)',
};
