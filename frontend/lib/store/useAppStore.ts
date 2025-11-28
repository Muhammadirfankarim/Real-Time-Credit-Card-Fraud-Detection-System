/**
 * App Store - Zustand
 * Global application state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'id';
export type ViewMode = 'dashboard' | 'analytics' | 'prediction';

export interface ModelStatus {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  modelType: 'onnx' | 'api' | null;
  loadTime: number | null;
}

export interface ApiStatus {
  isAvailable: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  latency: number | null;
}

interface AppState {
  // UI State
  theme: Theme;
  language: Language;
  sidebarOpen: boolean;
  currentView: ViewMode;

  // Model State
  modelStatus: ModelStatus;
  useONNX: boolean;
  useFallbackAPI: boolean;

  // API State
  apiStatus: ApiStatus;

  // Preferences
  autoSave: boolean;
  notifications: boolean;
  confidenceThreshold: number;
  batchSize: number;

  // Actions - UI
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: ViewMode) => void;

  // Actions - Model
  setModelLoaded: (loaded: boolean, type: 'onnx' | 'api', loadTime?: number) => void;
  setModelLoading: (loading: boolean) => void;
  setModelError: (error: string | null) => void;
  setUseONNX: (use: boolean) => void;
  setUseFallbackAPI: (use: boolean) => void;

  // Actions - API
  setApiAvailable: (available: boolean, latency?: number) => void;
  setApiChecking: (checking: boolean) => void;

  // Actions - Preferences
  setAutoSave: (autoSave: boolean) => void;
  setNotifications: (notifications: boolean) => void;
  setConfidenceThreshold: (threshold: number) => void;
  setBatchSize: (size: number) => void;

  // Actions - Reset
  resetToDefaults: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialModelStatus: ModelStatus = {
  isLoaded: false,
  isLoading: false,
  error: null,
  modelType: null,
  loadTime: null,
};

const initialApiStatus: ApiStatus = {
  isAvailable: false,
  isChecking: false,
  lastChecked: null,
  latency: null,
};

// ============================================================================
// STORE
// ============================================================================

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial State
      theme: 'dark',
      language: 'en',
      sidebarOpen: true,
      currentView: 'dashboard',
      modelStatus: initialModelStatus,
      useONNX: true,
      useFallbackAPI: true,
      apiStatus: initialApiStatus,
      autoSave: true,
      notifications: true,
      confidenceThreshold: 0.5,
      batchSize: 100,

      // UI Actions
      setTheme: (theme) => set({ theme }),

      setLanguage: (language) => set({ language }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      setCurrentView: (view) => set({ currentView: view }),

      // Model Actions
      setModelLoaded: (loaded, type, loadTime) =>
        set({
          modelStatus: {
            isLoaded: loaded,
            isLoading: false,
            error: null,
            modelType: loaded ? type : null,
            loadTime: loadTime || null,
          },
        }),

      setModelLoading: (loading) =>
        set((state) => ({
          modelStatus: {
            ...state.modelStatus,
            isLoading: loading,
            error: loading ? null : state.modelStatus.error,
          },
        })),

      setModelError: (error) =>
        set((state) => ({
          modelStatus: {
            ...state.modelStatus,
            isLoading: false,
            error,
          },
        })),

      setUseONNX: (use) => set({ useONNX: use }),

      setUseFallbackAPI: (use) => set({ useFallbackAPI: use }),

      // API Actions
      setApiAvailable: (available, latency) =>
        set({
          apiStatus: {
            isAvailable: available,
            isChecking: false,
            lastChecked: new Date(),
            latency: latency || null,
          },
        }),

      setApiChecking: (checking) =>
        set((state) => ({
          apiStatus: {
            ...state.apiStatus,
            isChecking: checking,
          },
        })),

      // Preference Actions
      setAutoSave: (autoSave) => set({ autoSave }),

      setNotifications: (notifications) => set({ notifications }),

      setConfidenceThreshold: (threshold) => set({ confidenceThreshold: threshold }),

      setBatchSize: (size) => set({ batchSize: size }),

      // Reset
      resetToDefaults: () =>
        set({
          theme: 'dark',
          language: 'en',
          sidebarOpen: true,
          currentView: 'dashboard',
          modelStatus: initialModelStatus,
          useONNX: true,
          useFallbackAPI: true,
          apiStatus: initialApiStatus,
          autoSave: true,
          notifications: true,
          confidenceThreshold: 0.5,
          batchSize: 100,
        }),
    }),
    {
      name: 'fraud-detection-app',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarOpen: state.sidebarOpen,
        useONNX: state.useONNX,
        useFallbackAPI: state.useFallbackAPI,
        autoSave: state.autoSave,
        notifications: state.notifications,
        confidenceThreshold: state.confidenceThreshold,
        batchSize: state.batchSize,
      }),
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Get model ready status
 */
export const useIsModelReady = () => {
  return useAppStore((state) => state.modelStatus.isLoaded && !state.modelStatus.error);
};

/**
 * Get prediction method (ONNX or API)
 */
export const usePredictionMethod = () => {
  return useAppStore((state) => {
    if (state.useONNX && state.modelStatus.isLoaded && state.modelStatus.modelType === 'onnx') {
      return 'onnx';
    }
    if (state.useFallbackAPI && state.apiStatus.isAvailable) {
      return 'api';
    }
    return null;
  });
};

/**
 * Get system health status
 */
export const useSystemHealth = () => {
  return useAppStore((state) => ({
    onnxReady: state.modelStatus.isLoaded && state.modelStatus.modelType === 'onnx',
    apiReady: state.apiStatus.isAvailable,
    hasError: !!state.modelStatus.error,
    isLoading: state.modelStatus.isLoading || state.apiStatus.isChecking,
  }));
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook for theme management
 */
export const useTheme = () => {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  return { theme, setTheme };
};

/**
 * Hook for model management
 */
export const useModel = () => {
  const store = useAppStore();

  return {
    status: store.modelStatus,
    useONNX: store.useONNX,
    useFallbackAPI: store.useFallbackAPI,
    setModelLoaded: store.setModelLoaded,
    setModelLoading: store.setModelLoading,
    setModelError: store.setModelError,
    setUseONNX: store.setUseONNX,
    setUseFallbackAPI: store.setUseFallbackAPI,
  };
};

/**
 * Hook for API management
 */
export const useApi = () => {
  const store = useAppStore();

  return {
    status: store.apiStatus,
    setApiAvailable: store.setApiAvailable,
    setApiChecking: store.setApiChecking,
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default useAppStore;
