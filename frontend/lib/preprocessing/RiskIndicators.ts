/**
 * RiskIndicators - Binary Fraud Risk Flags
 *
 * Calculates various risk indicators based on transaction characteristics.
 * These are binary flags that indicate potential fraud risk.
 */

import { RiskIndicators, RawTransaction } from '@/types/transaction';
import { HIGH_RISK_COUNTRIES, HIGH_RISK_MERCHANT_CATEGORIES } from '@/lib/utils/sampleData';

export class RiskIndicatorCalculator {
  private highRiskCountries: Set<string>;
  private highRiskMerchants: Set<string>;

  constructor() {
    this.highRiskCountries = new Set(HIGH_RISK_COUNTRIES);
    this.highRiskMerchants = new Set(HIGH_RISK_MERCHANT_CATEGORIES);
  }

  /**
   * Calculate all risk indicators for a transaction
   */
  calculate(transaction: RawTransaction): RiskIndicators {
    return {
      is_high_risk_country: this.isHighRiskCountry(transaction.country_code),
      is_online: this.isOnlineTransaction(transaction.channel),
      is_new_merchant: false, // Would need merchant history from database
      is_new_country: false, // Would need user's country history from database
      is_high_amount: this.isHighAmount(transaction.amount),
      is_unusual_hour: this.isUnusualHour(transaction.timestamp),
      is_velocity_spike: false, // Would need transaction history from database
      is_amount_spike: false, // Would need user's amount history from database
    };
  }

  /**
   * Check if country is in high-risk list
   */
  private isHighRiskCountry(countryCode?: string): boolean {
    if (!countryCode) return false;
    return this.highRiskCountries.has(countryCode.toUpperCase());
  }

  /**
   * Check if transaction is online
   * Online transactions have higher fraud rate than POS
   */
  private isOnlineTransaction(channel?: string): boolean {
    return channel === 'online';
  }

  /**
   * Check if amount is unusually high
   * Using 95th percentile threshold
   */
  private isHighAmount(amount: number): boolean {
    const P95_THRESHOLD = 394.64; // From dataset statistics
    return amount > P95_THRESHOLD;
  }

  /**
   * Check if hour is unusual (1-5 AM or 11 PM-12 AM)
   */
  private isUnusualHour(timestamp: string | Date): boolean {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const hour = date.getHours();

    return (hour >= 1 && hour <= 5) || (hour >= 23 && hour <= 24);
  }

  /**
   * Add high-risk country to the list
   */
  addHighRiskCountry(countryCode: string): void {
    this.highRiskCountries.add(countryCode.toUpperCase());
  }

  /**
   * Remove country from high-risk list
   */
  removeHighRiskCountry(countryCode: string): void {
    this.highRiskCountries.delete(countryCode.toUpperCase());
  }

  /**
   * Add high-risk merchant category
   */
  addHighRiskMerchant(category: string): void {
    this.highRiskMerchants.add(category);
  }

  /**
   * Remove merchant category from high-risk list
   */
  removeHighRiskMerchant(category: string): void {
    this.highRiskMerchants.delete(category);
  }

  /**
   * Get all high-risk countries
   */
  getHighRiskCountries(): string[] {
    return Array.from(this.highRiskCountries);
  }

  /**
   * Get all high-risk merchant categories
   */
  getHighRiskMerchants(): string[] {
    return Array.from(this.highRiskMerchants);
  }

  // ========================================================================
  // RISK SCORING
  // ========================================================================

  /**
   * Calculate overall risk score from indicators (0-1)
   */
  getRiskScore(indicators: RiskIndicators): number {
    let score = 0.0;

    // Weight each indicator
    if (indicators.is_high_risk_country) score += 0.25;
    if (indicators.is_online) score += 0.10;
    if (indicators.is_new_merchant) score += 0.15;
    if (indicators.is_new_country) score += 0.20;
    if (indicators.is_high_amount) score += 0.15;
    if (indicators.is_unusual_hour) score += 0.20;
    if (indicators.is_velocity_spike) score += 0.30;
    if (indicators.is_amount_spike) score += 0.25;

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Count number of risk flags
   */
  countRiskFlags(indicators: RiskIndicators): number {
    return Object.values(indicators).filter(Boolean).length;
  }

  /**
   * Get human-readable risk description
   */
  getRiskDescription(indicators: RiskIndicators): string[] {
    const descriptions: string[] = [];

    if (indicators.is_high_risk_country) {
      descriptions.push('Transaction from high-risk country');
    }

    if (indicators.is_online) {
      descriptions.push('Online transaction (higher fraud rate)');
    }

    if (indicators.is_new_merchant) {
      descriptions.push('First transaction with this merchant');
    }

    if (indicators.is_new_country) {
      descriptions.push('First transaction from this country');
    }

    if (indicators.is_high_amount) {
      descriptions.push('Unusually high transaction amount');
    }

    if (indicators.is_unusual_hour) {
      descriptions.push('Transaction at unusual hour');
    }

    if (indicators.is_velocity_spike) {
      descriptions.push('Multiple transactions in short time');
    }

    if (indicators.is_amount_spike) {
      descriptions.push('Amount significantly higher than usual');
    }

    return descriptions;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Quick calculate risk indicators
 */
export function calculateRiskIndicators(transaction: RawTransaction): RiskIndicators {
  const calculator = new RiskIndicatorCalculator();
  return calculator.calculate(transaction);
}

/**
 * Check if transaction has any risk flags
 */
export function hasRiskFlags(transaction: RawTransaction): boolean {
  const calculator = new RiskIndicatorCalculator();
  const indicators = calculator.calculate(transaction);
  return calculator.countRiskFlags(indicators) > 0;
}

/**
 * Get risk level from indicators
 */
export function getRiskLevelFromIndicators(indicators: RiskIndicators): string {
  const calculator = new RiskIndicatorCalculator();
  const riskScore = calculator.getRiskScore(indicators);

  if (riskScore < 0.2) return 'LOW';
  if (riskScore < 0.4) return 'MEDIUM';
  if (riskScore < 0.6) return 'HIGH';
  return 'VERY_HIGH';
}

/**
 * Get formatted risk report
 */
export function getRiskReport(transaction: RawTransaction): {
  indicators: RiskIndicators;
  score: number;
  level: string;
  flagCount: number;
  descriptions: string[];
} {
  const calculator = new RiskIndicatorCalculator();
  const indicators = calculator.calculate(transaction);
  const score = calculator.getRiskScore(indicators);
  const level = getRiskLevelFromIndicators(indicators);
  const flagCount = calculator.countRiskFlags(indicators);
  const descriptions = calculator.getRiskDescription(indicators);

  return {
    indicators,
    score,
    level,
    flagCount,
    descriptions,
  };
}

/**
 * Validate country code (ISO 3166-1 alpha-2)
 */
export function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}

/**
 * Get country risk category
 */
export function getCountryRiskCategory(countryCode?: string): 'high' | 'medium' | 'low' {
  if (!countryCode) return 'medium';

  const calculator = new RiskIndicatorCalculator();

  if (calculator.getHighRiskCountries().includes(countryCode.toUpperCase())) {
    return 'high';
  }

  // Medium risk countries (you can expand this list)
  const mediumRiskCountries = ['BR', 'AR', 'CO', 'MX', 'ZA', 'TR', 'EG'];
  if (mediumRiskCountries.includes(countryCode.toUpperCase())) {
    return 'medium';
  }

  return 'low';
}

/**
 * Get channel risk score
 */
export function getChannelRiskScore(channel?: string): number {
  switch (channel) {
    case 'online':
      return 0.4; // Higher risk
    case 'atm':
      return 0.3;
    case 'mobile':
      return 0.3;
    case 'pos':
      return 0.1; // Lower risk
    default:
      return 0.2;
  }
}

/**
 * Check if merchant category is high-risk
 */
export function isHighRiskMerchantCategory(category?: string): boolean {
  if (!category) return false;

  const calculator = new RiskIndicatorCalculator();
  return calculator.getHighRiskMerchants().includes(category);
}
