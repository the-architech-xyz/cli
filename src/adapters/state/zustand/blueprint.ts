/**
 * Zustand State Management Blueprint
 * 
 * Sets up Zustand for global state management
 * Creates stores, hooks, and state persistence
 */

import { Blueprint } from '../../../types/adapter.js';

export const zustandBlueprint: Blueprint = {
  id: 'zustand-base-setup',
  name: 'Zustand Base Setup',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['zustand']
    },
    {
      type: 'CREATE_FILE',
      path: '{{paths.state_config}}/use-app-store.ts',
      content: `import { create } from 'zustand';

export interface AppState {
  // User state
  user: {
    id: string | null;
    name: string | null;
    email: string | null;
    isAuthenticated: boolean;
  };
  
  // UI state
  ui: {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    loading: boolean;
  };
  
  // Actions
  setUser: (user: Partial<AppState['user']>) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setSidebarOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  user: {
    id: null,
    name: null,
    email: null,
    isAuthenticated: false,
  },
  ui: {
    theme: 'light' as const,
    sidebarOpen: false,
    loading: false,
  },
};

export const useAppStore = create<AppState>((set) => ({
        ...initialState,
        
        setUser: (user) =>
    set((state) => ({
              user: { ...state.user, ...user },
    })),
        
        setTheme: (theme) =>
    set((state) => ({
              ui: { ...state.ui, theme },
    })),
        
        setSidebarOpen: (sidebarOpen) =>
    set((state) => ({
              ui: { ...state.ui, sidebarOpen },
    })),
        
        setLoading: (loading) =>
    set((state) => ({
              ui: { ...state.ui, loading },
    })),
  
  reset: () => set(initialState),
}));

// Selectors for better performance
export const useUser = () => useAppStore((state) => state.user);
export const useUI = () => useAppStore((state) => state.ui);
export const useTheme = () => useAppStore((state) => state.ui.theme);
export const useSidebar = () => useAppStore((state) => state.ui.sidebarOpen);
export const useLoading = () => useAppStore((state) => state.ui.loading);

// Actions
export const useAppActions = () => useAppStore((state) => ({
  setUser: state.setUser,
  setTheme: state.setTheme,
  setSidebarOpen: state.setSidebarOpen,
  setLoading: state.setLoading,
  reset: state.reset,
}));`
    },
    {
      type: 'CREATE_FILE',
      path: '{{paths.state_config}}/index.ts',
      content: `/**
 * State Management Exports
 * 
 * Centralized exports for all Zustand stores
 */

// Main app store
export {
  useAppStore,
  useUser,
  useUI,
  useTheme,
  useSidebar,
  useLoading,
  useAppActions,
} from './use-app-store';

// Store types
export type { AppState } from './use-app-store';`
    }
  ]
};
