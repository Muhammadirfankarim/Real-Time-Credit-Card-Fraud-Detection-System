/**
 * Sample Data untuk Testing dan Demo
 *
 * Data ini adalah contoh transaksi yang sudah di-preprocess
 * (scaled dan PCA-transformed) sesuai format model.
 */

import { ProcessedTransaction, RawTransaction } from '@/types/transaction';

// ============================================================================
// SAMPLE NORMAL TRANSACTIONS (Pre-processed)
// ============================================================================

export const SAMPLE_NORMAL: ProcessedTransaction = {
  Time: 1.3871815012213498,
  V1: -0.674466064578314,
  V2: 1.40810501967799,
  V3: -1.11062205357093,
  V4: -1.32836577843066,
  V5: 1.38899603254837,
  V6: -1.30843906707795,
  V7: 1.88587890268717,
  V8: -0.614232966299775,
  V9: 0.311652212453101,
  V10: 0.65075700363522,
  V11: -0.857784661547805,
  V12: -0.229961445775592,
  V13: -0.19981700479103,
  V14: 0.266371326329879,
  V15: -0.0465441684754424,
  V16: -0.741398089749789,
  V17: -0.605616644106022,
  V18: -0.39256818789208,
  V19: -0.162648311024695,
  V20: 0.394321820843914,
  V21: 0.0800842396026648,
  V22: 0.810033595602455,
  V23: -0.224327230436412,
  V24: 0.707899237446867,
  V25: -0.13583702273753,
  V26: 0.0451021964988772,
  V27: 0.533837219064273,
  V28: 0.291319252625364,
  Amount: -0.25995438915074587,
};

export const SAMPLE_FRAUD: ProcessedTransaction = {
  Time: -0.7976298387694926,
  V1: -1.27124419171437,
  V2: 2.46267526851135,
  V3: -2.85139500331783,
  V4: 2.3244800653478,
  V5: -1.37224488981369,
  V6: -0.948195686538643,
  V7: -3.06523436172054,
  V8: 1.16692694787211,
  V9: -2.26877058844813,
  V10: -4.88114292689057,
  V11: 2.25514748870463,
  V12: -4.68638689759229,
  V13: 0.652374668512965,
  V14: -6.17428834800643,
  V15: 0.594379608016446,
  V16: -4.84969238709652,
  V17: -6.53652073527011,
  V18: -3.11909388163881,
  V19: 1.71549441975915,
  V20: 0.560478075726644,
  V21: 0.652941051330455,
  V22: 0.0819309763507574,
  V23: -0.221347831198339,
  V24: -0.523582159233306,
  V25: 0.224228161862968,
  V26: 0.756334522703558,
  V27: 0.632800477330469,
  V28: 0.250187092757197,
  Amount: -0.35164955468263087,
};

// ============================================================================
// SAMPLE RAW TRANSACTIONS (Untuk demo preprocessing)
// ============================================================================

export const SAMPLE_RAW_NORMAL: RawTransaction = {
  transaction_id: 'TXN_NORMAL_001',
  timestamp: new Date('2024-01-15T14:30:00Z'),
  amount: 149.62,
  card_type: 'credit',
  merchant_category: 'Retail',
  merchant_id: 'MERCHANT_123',
  country_code: 'US',
  city: 'New York',
  channel: 'pos',
  customer_id: 'CUST_456',
  customer_age: 35,
  customer_account_age_days: 720,
};

export const SAMPLE_RAW_FRAUD: RawTransaction = {
  transaction_id: 'TXN_FRAUD_001',
  timestamp: new Date('2024-01-15T03:15:00Z'), // Late night (suspicious)
  amount: 2500.00, // Large amount
  card_type: 'credit',
  merchant_category: 'Online',
  merchant_id: 'MERCHANT_999', // New merchant
  country_code: 'NG', // High-risk country
  city: 'Lagos',
  channel: 'online',
  customer_id: 'CUST_789',
  customer_age: 22,
  customer_account_age_days: 15, // New account
};

// ============================================================================
// MULTIPLE SAMPLE TRANSACTIONS (Untuk batch testing)
// ============================================================================

export const SAMPLE_BATCH_TRANSACTIONS: ProcessedTransaction[] = [
  SAMPLE_NORMAL,
  SAMPLE_FRAUD,
  {
    Time: 0.5,
    V1: -0.5,
    V2: 1.2,
    V3: -0.8,
    V4: -1.0,
    V5: 1.1,
    V6: -1.2,
    V7: 1.5,
    V8: -0.5,
    V9: 0.3,
    V10: 0.6,
    V11: -0.7,
    V12: -0.2,
    V13: -0.1,
    V14: 0.2,
    V15: -0.04,
    V16: -0.6,
    V17: -0.5,
    V18: -0.3,
    V19: -0.1,
    V20: 0.3,
    V21: 0.07,
    V22: 0.7,
    V23: -0.2,
    V24: 0.6,
    V25: -0.1,
    V26: 0.04,
    V27: 0.5,
    V28: 0.2,
    Amount: -0.2,
  },
  {
    Time: -0.8,
    V1: -1.5,
    V2: 2.8,
    V3: -3.1,
    V4: 2.5,
    V5: -1.5,
    V6: -1.0,
    V7: -3.2,
    V8: 1.3,
    V9: -2.5,
    V10: -5.0,
    V11: 2.4,
    V12: -4.9,
    V13: 0.7,
    V14: -6.5,
    V15: 0.6,
    V16: -5.0,
    V17: -6.8,
    V18: -3.3,
    V19: 1.8,
    V20: 0.6,
    V21: 0.7,
    V22: 0.08,
    V23: -0.25,
    V24: -0.6,
    V25: 0.25,
    V26: 0.8,
    V27: 0.7,
    V28: 0.3,
    Amount: -0.4,
  },
];

// ============================================================================
// DATASET STATISTICS (Dari creditcard.csv)
// ============================================================================

export const DATASET_STATS = {
  total_transactions: 284807,
  fraud_transactions: 492,
  normal_transactions: 284315,
  fraud_percentage: 0.172,
  time_range_seconds: 172792,
  time_range_hours: 48,
  amount_mean: 88.35,
  amount_std: 250.12,
  amount_min: 0.0,
  amount_max: 25691.16,
};

// ============================================================================
// FEATURE IMPORTANCE (Dari model training)
// ============================================================================

export const FEATURE_IMPORTANCE = [
  { feature: 'V17', importance: 0.21 },
  { feature: 'V14', importance: 0.19 },
  { feature: 'V12', importance: 0.16 },
  { feature: 'V10', importance: 0.14 },
  { feature: 'V11', importance: 0.13 },
  { feature: 'V16', importance: 0.11 },
  { feature: 'V4', importance: 0.10 },
  { feature: 'V3', importance: 0.09 },
  { feature: 'Amount', importance: 0.08 },
  { feature: 'V9', importance: 0.07 },
  { feature: 'V18', importance: 0.06 },
  { feature: 'V7', importance: 0.06 },
  { feature: 'V2', importance: 0.05 },
  { feature: 'Time', importance: 0.05 },
  { feature: 'V1', importance: 0.04 },
];

// ============================================================================
// HIGH RISK INDICATORS
// ============================================================================

export const HIGH_RISK_COUNTRIES = [
  'NG', // Nigeria
  'GH', // Ghana
  'ID', // Indonesia (some fraud patterns)
  'PK', // Pakistan
  'BD', // Bangladesh
  'PH', // Philippines
  'VN', // Vietnam
  'UA', // Ukraine
  'RU', // Russia
];

export const HIGH_RISK_MERCHANT_CATEGORIES = [
  'Online Gambling',
  'Cryptocurrency',
  'Adult Content',
  'Money Transfer',
  'Wire Transfer',
  'Gift Cards',
  'Prepaid Cards',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getRandomSample(): ProcessedTransaction {
  return Math.random() > 0.5 ? SAMPLE_NORMAL : SAMPLE_FRAUD;
}

export function generateRandomTransaction(): ProcessedTransaction {
  const isFraud = Math.random() < 0.002; // 0.2% fraud rate

  if (isFraud) {
    // Generate fraud-like transaction
    return {
      ...SAMPLE_FRAUD,
      Time: (Math.random() - 0.5) * 2,
      Amount: Math.random() < 0.5 ? -0.5 : 0.5 + Math.random(),
    };
  } else {
    // Generate normal transaction
    return {
      ...SAMPLE_NORMAL,
      Time: (Math.random() - 0.5) * 3,
      Amount: (Math.random() - 0.5) * 0.6,
    };
  }
}

export function generateBatchTransactions(count: number): ProcessedTransaction[] {
  return Array.from({ length: count }, () => generateRandomTransaction());
}
