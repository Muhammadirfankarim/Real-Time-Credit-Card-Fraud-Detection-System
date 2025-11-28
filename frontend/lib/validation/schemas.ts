/**
 * Validation Schemas using Zod
 * Type-safe validation for forms and data
 */

import { z } from 'zod';
import type { RiskLevel } from '@/types/transaction';

// ============================================================================
// BASIC SCHEMAS
// ============================================================================

/**
 * Email validation
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Positive number validation
 */
export const positiveNumberSchema = z.number().positive('Must be positive');

/**
 * Non-negative number validation
 */
export const nonNegativeNumberSchema = z.number().nonnegative('Must be non-negative');

/**
 * Date validation
 */
export const dateSchema = z.union([
  z.string().datetime(),
  z.date(),
]);

// ============================================================================
// TRANSACTION SCHEMAS
// ============================================================================

/**
 * Raw Transaction Input Schema
 * For user input from forms
 */
export const rawTransactionSchema = z.object({
  transaction_id: z.string().optional(),
  timestamp: z.union([z.string(), z.date()]),
  amount: z.number().positive('Amount must be positive'),
  card_type: z.enum(['credit', 'debit', 'prepaid']).optional(),
  merchant_category: z.string().optional(),
  country_code: z.string().length(2, 'Country code must be 2 characters').optional(),
  channel: z.enum(['online', 'pos', 'atm', 'mobile']).optional(),
  customer_id: z.string().optional(),
});

export type RawTransactionInput = z.infer<typeof rawTransactionSchema>;

/**
 * Processed Transaction Schema
 * For model input (30 features)
 */
export const processedTransactionSchema = z.object({
  Time: z.number(),
  V1: z.number(),
  V2: z.number(),
  V3: z.number(),
  V4: z.number(),
  V5: z.number(),
  V6: z.number(),
  V7: z.number(),
  V8: z.number(),
  V9: z.number(),
  V10: z.number(),
  V11: z.number(),
  V12: z.number(),
  V13: z.number(),
  V14: z.number(),
  V15: z.number(),
  V16: z.number(),
  V17: z.number(),
  V18: z.number(),
  V19: z.number(),
  V20: z.number(),
  V21: z.number(),
  V22: z.number(),
  V23: z.number(),
  V24: z.number(),
  V25: z.number(),
  V26: z.number(),
  V27: z.number(),
  V28: z.number(),
  Amount: z.number(),
});

export type ProcessedTransactionInput = z.infer<typeof processedTransactionSchema>;

/**
 * Manual Transaction Input Schema
 * Allows users to manually enter all 30 features
 */
export const manualTransactionSchema = processedTransactionSchema;

/**
 * Batch Upload Schema
 * Validates CSV upload data
 */
export const batchTransactionSchema = z.array(processedTransactionSchema).min(1, 'At least one transaction required');

// ============================================================================
// PREDICTION SCHEMAS
// ============================================================================

/**
 * Risk Level Schema
 */
export const riskLevelSchema = z.enum([
  'VERY_LOW',
  'LOW',
  'MEDIUM',
  'HIGH',
  'VERY_HIGH',
]);

/**
 * Prediction Result Schema
 */
export const predictionResultSchema = z.object({
  prediction: z.enum(['Fraud', 'Normal']),
  confidence_score: z.number().min(0).max(1),
  probability_fraud: z.number().min(0).max(1),
  probability_normal: z.number().min(0).max(1),
  risk_level: riskLevelSchema,
  timestamp: z.string().optional(),
  transaction_id: z.string().optional(),
});

export type PredictionResultInput = z.infer<typeof predictionResultSchema>;

// ============================================================================
// FORM SCHEMAS
// ============================================================================

/**
 * Quick Prediction Form Schema
 * For the main prediction interface
 */
export const quickPredictionFormSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(1000000, 'Amount too large'),
  timestamp: z.string().optional(),
  cardType: z.enum(['credit', 'debit', 'prepaid']).optional(),
  channel: z.enum(['online', 'pos', 'atm', 'mobile']).optional(),
  merchantCategory: z.string().optional(),
  countryCode: z.string().length(2).optional(),
});

export type QuickPredictionFormInput = z.infer<typeof quickPredictionFormSchema>;

/**
 * Advanced Prediction Form Schema
 * Allows full control over all 30 features
 */
export const advancedPredictionFormSchema = z.object({
  // Time feature
  Time: z.number(),

  // PCA features (V1-V28)
  V1: z.number().min(-10).max(10),
  V2: z.number().min(-10).max(10),
  V3: z.number().min(-10).max(10),
  V4: z.number().min(-10).max(10),
  V5: z.number().min(-10).max(10),
  V6: z.number().min(-10).max(10),
  V7: z.number().min(-10).max(10),
  V8: z.number().min(-10).max(10),
  V9: z.number().min(-10).max(10),
  V10: z.number().min(-10).max(10),
  V11: z.number().min(-10).max(10),
  V12: z.number().min(-10).max(10),
  V13: z.number().min(-10).max(10),
  V14: z.number().min(-10).max(10),
  V15: z.number().min(-10).max(10),
  V16: z.number().min(-10).max(10),
  V17: z.number().min(-10).max(10),
  V18: z.number().min(-10).max(10),
  V19: z.number().min(-10).max(10),
  V20: z.number().min(-10).max(10),
  V21: z.number().min(-10).max(10),
  V22: z.number().min(-10).max(10),
  V23: z.number().min(-10).max(10),
  V24: z.number().min(-10).max(10),
  V25: z.number().min(-10).max(10),
  V26: z.number().min(-10).max(10),
  V27: z.number().min(-10).max(10),
  V28: z.number().min(-10).max(10),

  // Amount feature
  Amount: z.number(),
});

export type AdvancedPredictionFormInput = z.infer<typeof advancedPredictionFormSchema>;

/**
 * Batch Upload Form Schema
 */
export const batchUploadFormSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.type === 'text/csv' || file.name.endsWith('.csv'),
    'File must be a CSV'
  ),
  maxRows: z.number().int().positive().max(10000).default(1000),
  skipHeader: z.boolean().default(true),
});

export type BatchUploadFormInput = z.infer<typeof batchUploadFormSchema>;

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

/**
 * Transaction Filter Schema
 * For filtering transaction history
 */
export const transactionFilterSchema = z.object({
  riskLevel: z.array(riskLevelSchema).optional(),
  prediction: z.enum(['Fraud', 'Normal', 'All']).optional(),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().positive().optional(),
  startDate: z.union([z.string(), z.date()]).optional(),
  endDate: z.union([z.string(), z.date()]).optional(),
  searchQuery: z.string().optional(),
}).refine(
  (data) => {
    if (data.minAmount !== undefined && data.maxAmount !== undefined) {
      return data.minAmount <= data.maxAmount;
    }
    return true;
  },
  { message: 'Min amount must be less than max amount' }
).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    }
    return true;
  },
  { message: 'Start date must be before end date' }
);

export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;

// ============================================================================
// SETTINGS SCHEMAS
// ============================================================================

/**
 * User Preferences Schema
 */
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('dark'),
  language: z.enum(['en', 'id']).default('en'),
  notifications: z.boolean().default(true),
  autoSave: z.boolean().default(true),
  defaultView: z.enum(['dashboard', 'analytics', 'prediction']).default('dashboard'),
});

export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;

/**
 * Model Settings Schema
 */
export const modelSettingsSchema = z.object({
  useONNX: z.boolean().default(true),
  useFallbackAPI: z.boolean().default(true),
  confidenceThreshold: z.number().min(0).max(1).default(0.5),
  batchSize: z.number().int().positive().max(10000).default(100),
});

export type ModelSettingsInput = z.infer<typeof modelSettingsSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate and parse data with Zod schema
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Safe parse (doesn't throw)
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): z.SafeParseReturnType<unknown, T> {
  return schema.safeParse(data);
}

/**
 * Get readable error messages from Zod errors
 */
export function getErrorMessages(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
}

/**
 * Get first error message
 */
export function getFirstError(error: z.ZodError): string {
  return getErrorMessages(error)[0] || 'Validation failed';
}

/**
 * Format errors for form display
 */
export function formatFormErrors(
  error: z.ZodError
): Record<string, string> {
  const formErrors: Record<string, string> = {};

  error.errors.forEach((err) => {
    const field = err.path.join('.');
    if (field && !formErrors[field]) {
      formErrors[field] = err.message;
    }
  });

  return formErrors;
}

// ============================================================================
// CUSTOM VALIDATORS
// ============================================================================

/**
 * Check if amount is suspicious
 */
export const isSuspiciousAmount = (amount: number): boolean => {
  // Very large amounts (> $10,000)
  if (amount > 10000) return true;

  // Very round numbers (divisible by 1000)
  if (amount >= 1000 && amount % 1000 === 0) return true;

  return false;
};

/**
 * Validate credit card number (Luhn algorithm)
 */
export const validateCardNumber = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validate country code (ISO 3166-1 alpha-2)
 */
export const validateCountryCode = (code: string): boolean => {
  return /^[A-Z]{2}$/.test(code);
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  rawTransaction: rawTransactionSchema,
  processedTransaction: processedTransactionSchema,
  manualTransaction: manualTransactionSchema,
  batchTransaction: batchTransactionSchema,
  predictionResult: predictionResultSchema,
  quickPredictionForm: quickPredictionFormSchema,
  advancedPredictionForm: advancedPredictionFormSchema,
  batchUploadForm: batchUploadFormSchema,
  transactionFilter: transactionFilterSchema,
  userPreferences: userPreferencesSchema,
  modelSettings: modelSettingsSchema,
};
