/**
 * TemporalFeatures - Time-based Feature Extraction
 *
 * Extracts temporal patterns from transaction timestamps.
 * Fraud detection benefits greatly from temporal features as fraud
 * patterns often occur at specific times (e.g., late night).
 */

import { TemporalFeatures } from '@/types/transaction';

export class TemporalFeatureExtractor {
  private referenceTime: Date;

  /**
   * @param referenceTime - The reference point for calculating time deltas
   *                       (typically the first transaction in the dataset)
   */
  constructor(referenceTime?: Date) {
    this.referenceTime = referenceTime || new Date('2013-09-01T00:00:00Z');
  }

  /**
   * Extract all temporal features from a timestamp
   */
  extract(timestamp: string | Date): TemporalFeatures {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

    return {
      hour: this.extractHour(date),
      day_of_week: this.extractDayOfWeek(date),
      is_weekend: this.isWeekend(date),
      is_night: this.isNightTime(date),
      is_business_hours: this.isBusinessHours(date),
      seconds_from_first: this.getSecondsFromReference(date),
    };
  }

  /**
   * Extract hour of day (0-23)
   */
  private extractHour(date: Date): number {
    return date.getHours();
  }

  /**
   * Extract day of week (0-6, where 0 = Sunday)
   */
  private extractDayOfWeek(date: Date): number {
    return date.getDay();
  }

  /**
   * Check if transaction is on weekend
   * Fraud patterns differ between weekdays and weekends
   */
  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  /**
   * Check if transaction is during night time (22:00 - 06:00)
   * Night transactions have higher fraud probability
   */
  private isNightTime(date: Date): boolean {
    const hour = date.getHours();
    return hour >= 22 || hour <= 6;
  }

  /**
   * Check if transaction is during business hours (09:00 - 17:00)
   * Transactions outside business hours are more suspicious
   */
  private isBusinessHours(date: Date): boolean {
    const hour = date.getHours();
    const day = date.getDay();

    // Not on weekend and between 9 AM and 5 PM
    return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
  }

  /**
   * Calculate seconds elapsed since reference time
   * This is the "Time" feature in the dataset
   */
  private getSecondsFromReference(date: Date): number {
    const diff = date.getTime() - this.referenceTime.getTime();
    return Math.floor(diff / 1000); // Convert ms to seconds
  }

  /**
   * Set new reference time
   */
  setReferenceTime(referenceTime: Date): void {
    this.referenceTime = referenceTime;
  }

  /**
   * Get current reference time
   */
  getReferenceTime(): Date {
    return this.referenceTime;
  }

  // ========================================================================
  // ADVANCED TEMPORAL FEATURES (for enhanced fraud detection)
  // ========================================================================

  /**
   * Check if hour is unusual for typical transaction patterns
   * Based on fraud detection research, these hours are high-risk:
   * - Very early morning (1-5 AM)
   * - Late night (11 PM - midnight)
   */
  isUnusualHour(date: Date): boolean {
    const hour = date.getHours();
    return (hour >= 1 && hour <= 5) || (hour >= 23 && hour <= 24);
  }

  /**
   * Get hour category for pattern analysis
   */
  getHourCategory(date: Date): 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = date.getHours();

    if (hour >= 0 && hour < 6) return 'early_morning'; // 12 AM - 6 AM
    if (hour >= 6 && hour < 12) return 'morning'; // 6 AM - 12 PM
    if (hour >= 12 && hour < 17) return 'afternoon'; // 12 PM - 5 PM
    if (hour >= 17 && hour < 21) return 'evening'; // 5 PM - 9 PM
    return 'night'; // 9 PM - 12 AM
  }

  /**
   * Calculate time since last transaction (for velocity detection)
   * Requires previous transaction timestamp
   */
  getTimeSinceLastTransaction(
    currentTimestamp: Date,
    lastTimestamp: Date | null
  ): number {
    if (!lastTimestamp) return -1; // No previous transaction

    const diff = currentTimestamp.getTime() - lastTimestamp.getTime();
    return Math.floor(diff / 1000); // Seconds
  }

  /**
   * Check if transaction velocity is suspicious
   * Multiple transactions in very short time (< 60 seconds) is suspicious
   */
  isSuspiciousVelocity(timeSinceLastTx: number): boolean {
    if (timeSinceLastTx === -1) return false; // First transaction
    return timeSinceLastTx < 60; // Less than 1 minute
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Quick extract temporal features from timestamp
 */
export function extractTemporalFeatures(timestamp: string | Date): TemporalFeatures {
  const extractor = new TemporalFeatureExtractor();
  return extractor.extract(timestamp);
}

/**
 * Check if timestamp is in high-risk time period
 */
export function isHighRiskTime(timestamp: string | Date): boolean {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const hour = date.getHours();

  // High-risk hours: 10 PM - 6 AM
  return hour >= 22 || hour <= 6;
}

/**
 * Get fraud risk score based on time (0-1)
 * Higher score = higher risk
 */
export function getTemporalRiskScore(timestamp: string | Date): number {
  const extractor = new TemporalFeatureExtractor();
  const features = extractor.extract(timestamp);

  let riskScore = 0.0;

  // Night time +0.3
  if (features.is_night) riskScore += 0.3;

  // Weekend +0.2
  if (features.is_weekend) riskScore += 0.2;

  // Outside business hours +0.2
  if (!features.is_business_hours) riskScore += 0.2;

  // Unusual hour (1-5 AM) +0.3
  if (extractor.isUnusualHour(new Date(timestamp))) riskScore += 0.3;

  return Math.min(riskScore, 1.0); // Cap at 1.0
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Get human-readable description of temporal risk
 */
export function getTemporalRiskDescription(timestamp: string | Date): string {
  const extractor = new TemporalFeatureExtractor();
  const features = extractor.extract(timestamp);
  const risks: string[] = [];

  if (features.is_night) {
    risks.push('Night time transaction (10 PM - 6 AM)');
  }

  if (features.is_weekend) {
    risks.push('Weekend transaction');
  }

  if (!features.is_business_hours) {
    risks.push('Outside business hours');
  }

  if (extractor.isUnusualHour(new Date(timestamp))) {
    risks.push('Unusual hour (1-5 AM or 11 PM-12 AM)');
  }

  if (risks.length === 0) {
    return 'Normal transaction time';
  }

  return risks.join(', ');
}
