/**
 * Prediction Store - Zustand
 * Manages prediction state and history
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  PredictionResult,
  ProcessedTransaction,
  RiskLevel,
} from '@/types/transaction';

// ============================================================================
// TYPES
// ============================================================================

export interface PredictionHistoryItem {
  id: string;
  timestamp: Date;
  transaction: ProcessedTransaction;
  result: PredictionResult;
}

export interface PredictionStats {
  totalPredictions: number;
  fraudDetected: number;
  normalDetected: number;
  averageConfidence: number;
  riskDistribution: Record<RiskLevel, number>;
}

interface PredictionState {
  // Current prediction
  currentPrediction: PredictionResult | null;
  currentTransaction: ProcessedTransaction | null;
  isLoading: boolean;
  error: string | null;

  // History
  history: PredictionHistoryItem[];
  maxHistorySize: number;

  // Statistics
  stats: PredictionStats;

  // Actions
  setPrediction: (transaction: ProcessedTransaction, result: PredictionResult) => void;
  clearPrediction: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addToHistory: (transaction: ProcessedTransaction, result: PredictionResult) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
  getHistoryById: (id: string) => PredictionHistoryItem | undefined;
  updateStats: () => void;
  clearAll: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialStats: PredictionStats = {
  totalPredictions: 0,
  fraudDetected: 0,
  normalDetected: 0,
  averageConfidence: 0,
  riskDistribution: {
    Low: 0,
    Medium: 0,
    High: 0,
  },
};

// ============================================================================
// STORE
// ============================================================================

export const usePredictionStore = create<PredictionState>()(
  persist(
    (set, get) => ({
      // State
      currentPrediction: null,
      currentTransaction: null,
      isLoading: false,
      error: null,
      history: [],
      maxHistorySize: 100,
      stats: initialStats,

      // Actions
      setPrediction: (transaction, result) => {
        set({
          currentPrediction: result,
          currentTransaction: transaction,
          isLoading: false,
          error: null,
        });

        // Automatically add to history
        get().addToHistory(transaction, result);
      },

      clearPrediction: () => {
        set({
          currentPrediction: null,
          currentTransaction: null,
          error: null,
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
        if (loading) {
          set({ error: null });
        }
      },

      setError: (error) => {
        set({
          error,
          isLoading: false,
        });
      },

      addToHistory: (transaction, result) => {
        const newItem: PredictionHistoryItem = {
          id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          transaction,
          result,
        };

        set((state) => {
          const newHistory = [newItem, ...state.history];

          // Limit history size
          if (newHistory.length > state.maxHistorySize) {
            newHistory.pop();
          }

          return { history: newHistory };
        });

        // Update stats
        get().updateStats();
      },

      clearHistory: () => {
        set({
          history: [],
          stats: initialStats,
        });
      },

      removeFromHistory: (id) => {
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        }));
        get().updateStats();
      },

      getHistoryById: (id) => {
        return get().history.find((item) => item.id === id);
      },

      updateStats: () => {
        const { history } = get();

        if (history.length === 0) {
          set({ stats: initialStats });
          return;
        }

        const stats: PredictionStats = {
          totalPredictions: history.length,
          fraudDetected: 0,
          normalDetected: 0,
          averageConfidence: 0,
          riskDistribution: {
            Low: 0,
            Medium: 0,
            High: 0,
          },
        };

        let totalConfidence = 0;

        history.forEach((item) => {
          // Count predictions
          if (item.result.prediction === 'Fraud') {
            stats.fraudDetected++;
          } else {
            stats.normalDetected++;
          }

          // Sum confidence
          totalConfidence += item.result.confidence_score;

          // Count risk levels
          stats.riskDistribution[item.result.risk_level]++;
        });

        // Calculate average confidence
        stats.averageConfidence = totalConfidence / history.length;

        set({ stats });
      },

      clearAll: () => {
        set({
          currentPrediction: null,
          currentTransaction: null,
          isLoading: false,
          error: null,
          history: [],
          stats: initialStats,
        });
      },
    }),
    {
      name: 'fraud-detection-predictions',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        history: state.history,
        stats: state.stats,
      }),
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Get fraud rate from history
 */
export const useFraudRate = () => {
  return usePredictionStore((state) => {
    const { totalPredictions, fraudDetected } = state.stats;
    return totalPredictions > 0 ? (fraudDetected / totalPredictions) * 100 : 0;
  });
};

/**
 * Get recent predictions (last N)
 */
export const useRecentPredictions = (count: number = 10) => {
  return usePredictionStore((state) => state.history.slice(0, count));
};

/**
 * Get predictions by risk level
 */
export const usePredictionsByRisk = (riskLevel: RiskLevel) => {
  return usePredictionStore((state) =>
    state.history.filter((item) => item.result.risk_level === riskLevel)
  );
};

/**
 * Get fraud predictions only
 */
export const useFraudPredictions = () => {
  return usePredictionStore((state) =>
    state.history.filter((item) => item.result.prediction === 'Fraud')
  );
};

/**
 * Get normal predictions only
 */
export const useNormalPredictions = () => {
  return usePredictionStore((state) =>
    state.history.filter((item) => item.result.prediction === 'Normal')
  );
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook for prediction operations
 */
export const usePrediction = () => {
  const store = usePredictionStore();

  return {
    prediction: store.currentPrediction,
    transaction: store.currentTransaction,
    isLoading: store.isLoading,
    error: store.error,
    setPrediction: store.setPrediction,
    clearPrediction: store.clearPrediction,
    setLoading: store.setLoading,
    setError: store.setError,
  };
};

/**
 * Hook for history operations
 */
export const usePredictionHistory = () => {
  const store = usePredictionStore();

  return {
    history: store.history,
    stats: store.stats,
    addToHistory: store.addToHistory,
    clearHistory: store.clearHistory,
    removeFromHistory: store.removeFromHistory,
    getHistoryById: store.getHistoryById,
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default usePredictionStore;
