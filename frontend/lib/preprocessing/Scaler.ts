/**
 * Scaler - StandardScaler Implementation
 *
 * Implements z-score normalization (standardization) for features.
 * Formula: z = (x - mean) / std
 *
 * This matches scikit-learn's StandardScaler behavior.
 */

export interface ScalerParams {
  mean: Record<string, number>;
  std: Record<string, number>;
}

export class StandardScaler {
  private mean: Record<string, number>;
  private std: Record<string, number>;
  private fitted: boolean = false;

  constructor(params?: ScalerParams) {
    if (params) {
      this.mean = params.mean;
      this.std = params.std;
      this.fitted = true;
    } else {
      this.mean = {};
      this.std = {};
      this.fitted = false;
    }
  }

  /**
   * Fit the scaler on training data
   * (Usually done during model training, not needed for inference)
   */
  fit(data: Record<string, number[]>): void {
    Object.keys(data).forEach((feature) => {
      const values = data[feature];
      this.mean[feature] = this.calculateMean(values);
      this.std[feature] = this.calculateStd(values, this.mean[feature]);
    });
    this.fitted = true;
  }

  /**
   * Transform (scale) data using fitted parameters
   */
  transform(data: Record<string, number>): Record<string, number> {
    if (!this.fitted) {
      throw new Error('Scaler must be fitted before transform');
    }

    const scaled: Record<string, number> = {};

    Object.keys(data).forEach((feature) => {
      const value = data[feature];
      const mean = this.mean[feature] || 0;
      const std = this.std[feature] || 1;

      // Z-score normalization: (x - mean) / std
      scaled[feature] = std === 0 ? 0 : (value - mean) / std;
    });

    return scaled;
  }

  /**
   * Inverse transform (unscale) data back to original scale
   */
  inverseTransform(data: Record<string, number>): Record<string, number> {
    if (!this.fitted) {
      throw new Error('Scaler must be fitted before inverse transform');
    }

    const unscaled: Record<string, number> = {};

    Object.keys(data).forEach((feature) => {
      const scaledValue = data[feature];
      const mean = this.mean[feature] || 0;
      const std = this.std[feature] || 1;

      // Inverse: x = (z * std) + mean
      unscaled[feature] = scaledValue * std + mean;
    });

    return unscaled;
  }

  /**
   * Transform a single feature value
   */
  transformSingle(feature: string, value: number): number {
    if (!this.fitted) {
      throw new Error('Scaler must be fitted before transform');
    }

    const mean = this.mean[feature] || 0;
    const std = this.std[feature] || 1;

    return std === 0 ? 0 : (value - mean) / std;
  }

  /**
   * Inverse transform a single feature value
   */
  inverseTransformSingle(feature: string, scaledValue: number): number {
    if (!this.fitted) {
      throw new Error('Scaler must be fitted before inverse transform');
    }

    const mean = this.mean[feature] || 0;
    const std = this.std[feature] || 1;

    return scaledValue * std + mean;
  }

  /**
   * Get scaler parameters (for saving/loading)
   */
  getParams(): ScalerParams {
    return {
      mean: { ...this.mean },
      std: { ...this.std },
    };
  }

  /**
   * Load scaler parameters
   */
  loadParams(params: ScalerParams): void {
    this.mean = { ...params.mean };
    this.std = { ...params.std };
    this.fitted = true;
  }

  /**
   * Check if scaler is fitted
   */
  isFitted(): boolean {
    return this.fitted;
  }

  // ========================================================================
  // PRIVATE HELPER METHODS
  // ========================================================================

  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  private calculateStd(values: number[], mean: number): number {
    if (values.length === 0) return 1;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }
}

// ============================================================================
// PRE-TRAINED SCALER FOR FRAUD DETECTION
// ============================================================================

/**
 * Create scaler with pre-trained parameters from the fraud detection model.
 * These parameters were learned during training on the creditcard.csv dataset.
 *
 * Only Time and Amount features need scaling.
 * V1-V28 are already PCA-transformed and normalized.
 */
export function createPretrainedScaler(): StandardScaler {
  // These values come from the training data statistics
  const params: ScalerParams = {
    mean: {
      Time: 94813.859575, // Mean time in seconds
      Amount: 88.349619, // Mean transaction amount
    },
    std: {
      Time: 47488.145955, // Std deviation of time
      Amount: 250.120109, // Std deviation of amount
    },
  };

  const scaler = new StandardScaler();
  scaler.loadParams(params);
  return scaler;
}

/**
 * Quick scale function for Time and Amount
 */
export function quickScale(time: number, amount: number): { Time: number; Amount: number } {
  const scaler = createPretrainedScaler();

  return {
    Time: scaler.transformSingle('Time', time),
    Amount: scaler.transformSingle('Amount', amount),
  };
}

/**
 * Quick inverse scale function
 */
export function quickInverseScale(
  scaledTime: number,
  scaledAmount: number
): { Time: number; Amount: number } {
  const scaler = createPretrainedScaler();

  return {
    Time: scaler.inverseTransformSingle('Time', scaledTime),
    Amount: scaler.inverseTransformSingle('Amount', scaledAmount),
  };
}
