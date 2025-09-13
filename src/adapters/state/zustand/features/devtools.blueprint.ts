/**
 * Zustand DevTools Feature Blueprint
 * 
 * Integration with Redux DevTools for debugging
 */

import { Blueprint } from '../../../../types/adapter.js';

const devtoolsBlueprint: Blueprint = {
  id: 'zustand-devtools',
  name: 'Redux DevTools',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/stores/use-app-store.ts',
      content: `import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppState {
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

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      setUser: (user) =>
        set(
          (state) => ({
            user: { ...state.user, ...user },
          }),
          false,
          'setUser'
        ),
      
      setTheme: (theme) =>
        set(
          (state) => ({
            ui: { ...state.ui, theme },
          }),
          false,
          'setTheme'
        ),
      
      setSidebarOpen: (sidebarOpen) =>
        set(
          (state) => ({
            ui: { ...state.ui, sidebarOpen },
          }),
          false,
          'setSidebarOpen'
        ),
      
      setLoading: (loading) =>
        set(
          (state) => ({
            ui: { ...state.ui, loading },
          }),
          false,
          'setLoading'
        ),
      
      reset: () =>
        set(initialState, false, 'reset'),
    }),
    {
      name: '{{module.parameters.name}}',
      {{#if module.parameters.enabled}}
      enabled: true,
      {{else}}
      enabled: false,
      {{/if}}
    }
  )
);

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
      path: 'src/lib/devtools/devtools-utils.ts',
      content: `import { StateCreator } from 'zustand';

/**
 * DevTools utilities for Zustand stores
 */
export interface DevToolsConfig {
  name: string;
  enabled?: boolean;
  trace?: boolean;
  traceLimit?: number;
}

/**
 * Enhanced DevTools middleware with additional features
 */
export function createDevToolsMiddleware<T>(
  config: DevToolsConfig
): StateCreator<T, [['zustand/devtools', never]], [], T> {
  return (set, get, api) => {
    const devtools = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
    
    if (!devtools || !config.enabled) {
      return api;
    }

    const devtoolsInstance = devtools.connect({
      name: config.name,
      trace: config.trace,
      traceLimit: config.traceLimit || 25,
    });

    // Subscribe to DevTools actions
    devtoolsInstance.subscribe((message: any) => {
      if (message.type === 'DISPATCH') {
        switch (message.payload.type) {
          case 'RESET':
            // Reset store to initial state
            api.setState(api.getInitialState());
            break;
          
          case 'JUMP_TO_STATE':
          case 'JUMP_TO_ACTION':
            // Jump to specific state
            api.setState(JSON.parse(message.state));
            break;
          
          case 'TOGGLE_ACTION':
            // Toggle action
            break;
          
          case 'IMPORT_STATE':
            // Import state
            const { nextLiftedState } = message.payload;
            if (nextLiftedState) {
              api.setState(nextLiftedState.computedStates[nextLiftedState.currentStateIndex].state);
            }
            break;
        }
      }
    });

    // Send initial state
    devtoolsInstance.init(api.getState());

    // Enhanced set function
    const enhancedSet = (partial: any, replace?: boolean, action?: string) => {
      const result = set(partial, replace);
      
      if (action) {
        devtoolsInstance.send(action, api.getState());
      }
      
      return result;
    };

    return {
      ...api,
      setState: enhancedSet,
    };
  };
}

/**
 * Action logger for debugging
 */
export function createActionLogger<T>(storeName: string) {
  return (action: string, state: T, prevState: T) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(\`🔄 \${storeName} - \${action}\`);
      console.log('Previous State:', prevState);
      console.log('New State:', state);
      console.log('Changes:', getStateChanges(prevState, state));
      console.groupEnd();
    }
  };
}

/**
 * Get state changes between two states
 */
function getStateChanges(prevState: any, newState: any): any {
  const changes: any = {};
  
  function compareObjects(prev: any, curr: any, path: string = '') {
    for (const key in curr) {
      const currentPath = path ? \`\${path}.\${key}\` : key;
      
      if (typeof curr[key] === 'object' && curr[key] !== null && !Array.isArray(curr[key])) {
        if (typeof prev[key] === 'object' && prev[key] !== null) {
          compareObjects(prev[key], curr[key], currentPath);
        } else {
          changes[currentPath] = { from: prev[key], to: curr[key] };
        }
      } else if (prev[key] !== curr[key]) {
        changes[currentPath] = { from: prev[key], to: curr[key] };
      }
    }
  }
  
  compareObjects(prevState, newState);
  return changes;
}

/**
 * Store inspector for debugging
 */
export function createStoreInspector<T>(store: any, storeName: string) {
  return {
    getState: () => store.getState(),
    getActions: () => {
      const state = store.getState();
      return Object.keys(state).filter(key => typeof state[key] === 'function');
    },
    getSelectors: () => {
      const state = store.getState();
      return Object.keys(state).filter(key => typeof state[key] !== 'function');
    },
    subscribe: (callback: (state: T) => void) => {
      return store.subscribe(callback);
    },
    reset: () => {
      store.setState(store.getInitialState());
    },
    logState: () => {
      console.log(\`📊 \${storeName} State:\`, store.getState());
    },
    logActions: () => {
      const actions = Object.keys(store.getState()).filter(key => 
        typeof store.getState()[key] === 'function'
      );
      console.log(\`🎬 \${storeName} Actions:\`, actions);
    },
  };
}

/**
 * Performance monitor for store operations
 */
export function createPerformanceMonitor(storeName: string) {
  const metrics = {
    actionCount: 0,
    totalTime: 0,
    averageTime: 0,
    slowestAction: { name: '', time: 0 },
  };

  return {
    startTimer: (actionName: string) => {
      const start = performance.now();
      return {
        end: () => {
          const end = performance.now();
          const duration = end - start;
          
          metrics.actionCount++;
          metrics.totalTime += duration;
          metrics.averageTime = metrics.totalTime / metrics.actionCount;
          
          if (duration > metrics.slowestAction.time) {
            metrics.slowestAction = { name: actionName, time: duration };
          }
          
          if (duration > 10) { // Log slow actions (>10ms)
            console.warn(\`🐌 Slow action detected: \${actionName} took \${duration.toFixed(2)}ms\`);
          }
        },
      };
    },
    getMetrics: () => metrics,
    resetMetrics: () => {
      metrics.actionCount = 0;
      metrics.totalTime = 0;
      metrics.averageTime = 0;
      metrics.slowestAction = { name: '', time: 0 };
    },
  };
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/components/devtools/DevToolsPanel.tsx',
      content: `'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../lib/stores/use-app-store.js';
import { createStoreInspector, createPerformanceMonitor } from '../../lib/devtools/devtools-utils.js';

interface DevToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevToolsPanel: React.FC<DevToolsPanelProps> = ({ isOpen, onClose }) => {
  const [state, setState] = useState(useAppStore.getState());
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [actionArgs, setActionArgs] = useState<string>('{}');
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  const store = useAppStore();
  const inspector = createStoreInspector(store, 'AppStore');
  const performanceMonitor = createPerformanceMonitor('AppStore');

  useEffect(() => {
    const unsubscribe = store.subscribe(setState);
    return unsubscribe;
  }, [store]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceMetrics(performanceMonitor.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, [performanceMonitor]);

  const executeAction = () => {
    try {
      const args = JSON.parse(actionArgs);
      const action = store.getState()[selectedAction as keyof typeof state];
      
      if (typeof action === 'function') {
        const timer = performanceMonitor.startTimer(selectedAction);
        action(args);
        timer.end();
      }
    } catch (error) {
      console.error('Error executing action:', error);
    }
  };

  const resetStore = () => {
    inspector.reset();
  };

  const exportState = () => {
    const stateData = JSON.stringify(state, null, 2);
    const blob = new Blob([stateData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app-state.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importState = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedState = JSON.parse(e.target?.result as string);
          store.setState(importedState);
        } catch (error) {
          console.error('Error importing state:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Zustand DevTools</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-1/3 border-r p-4 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Actions</h3>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select an action</option>
                {inspector.getActions().map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Action Arguments</h3>
              <textarea
                value={actionArgs}
                onChange={(e) => setActionArgs(e.target.value)}
                className="w-full p-2 border rounded h-20"
                placeholder="JSON arguments"
              />
            </div>
            
            <button
              onClick={executeAction}
              disabled={!selectedAction}
              className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-gray-300"
            >
              Execute Action
            </button>
            
            <div className="space-y-2">
              <button
                onClick={resetStore}
                className="w-full bg-red-500 text-white p-2 rounded"
              >
                Reset Store
              </button>
              
              <button
                onClick={exportState}
                className="w-full bg-green-500 text-white p-2 rounded"
              >
                Export State
              </button>
              
              <label className="w-full bg-purple-500 text-white p-2 rounded cursor-pointer block text-center">
                Import State
                <input
                  type="file"
                  accept=".json"
                  onChange={importState}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 p-4">
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* State Viewer */}
              <div>
                <h3 className="font-semibold mb-2">Current State</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto h-96">
                  {JSON.stringify(state, null, 2)}
                </pre>
              </div>
              
              {/* Performance Metrics */}
              <div>
                <h3 className="font-semibold mb-2">Performance Metrics</h3>
                {performanceMetrics && (
                  <div className="space-y-2">
                    <div className="bg-gray-100 p-3 rounded">
                      <div>Action Count: {performanceMetrics.actionCount}</div>
                      <div>Average Time: {performanceMetrics.averageTime.toFixed(2)}ms</div>
                      <div>Total Time: {performanceMetrics.totalTime.toFixed(2)}ms</div>
                      <div>Slowest Action: {performanceMetrics.slowestAction.name} ({performanceMetrics.slowestAction.time.toFixed(2)}ms)</div>
                    </div>
                    <button
                      onClick={() => performanceMonitor.resetMetrics()}
                      className="w-full bg-gray-500 text-white p-2 rounded"
                    >
                      Reset Metrics
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/hooks/useDevTools.ts',
      content: `import { useState, useEffect } from 'react';
import { useAppStore } from '../lib/stores/use-app-store.js';
import { createStoreInspector, createPerformanceMonitor } from '../lib/devtools/devtools-utils.js';

export function useDevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState(useAppStore.getState());
  const store = useAppStore();
  const inspector = createStoreInspector(store, 'AppStore');
  const performanceMonitor = createPerformanceMonitor('AppStore');

  useEffect(() => {
    const unsubscribe = store.subscribe(setState);
    return unsubscribe;
  }, [store]);

  const openDevTools = () => setIsOpen(true);
  const closeDevTools = () => setIsOpen(false);

  const logState = () => inspector.logState();
  const logActions = () => inspector.logActions();
  const resetStore = () => inspector.reset();

  const getPerformanceMetrics = () => performanceMonitor.getMetrics();
  const resetPerformanceMetrics = () => performanceMonitor.resetMetrics();

  // Keyboard shortcut to open DevTools
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return {
    isOpen,
    state,
    openDevTools,
    closeDevTools,
    logState,
    logActions,
    resetStore,
    getPerformanceMetrics,
    resetPerformanceMetrics,
    inspector,
    performanceMonitor,
  };
}

export function useDevToolsShortcut() {
  const { openDevTools, closeDevTools, isOpen } = useDevTools();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        if (isOpen) {
          closeDevTools();
        } else {
          openDevTools();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, openDevTools, closeDevTools]);

  return { isOpen, openDevTools, closeDevTools };
}`
    }
  ]
};
export default devtoolsBlueprint;
