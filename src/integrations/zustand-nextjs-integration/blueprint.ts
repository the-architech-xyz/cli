import { Blueprint } from '../../types/adapter.js';

const zustandNextjsIntegrationBlueprint: Blueprint = {
  id: 'zustand-nextjs-integration',
  name: 'Zustand Next.js Integration',
  description: 'Complete state management integration for Next.js applications',
  version: '1.0.0',
  actions: [
    // PURE MODIFIER: Enhance existing Zustand files with Next.js-specific functionality
    {
      type: 'ENHANCE_FILE',
      path: 'src/lib/stores/index.ts',
      modifier: 'ts-module-enhancer',
      params: {
        importsToAdd: [
          { name: 'useEffect', from: 'react', type: 'import' },
          { name: 'useState', from: 'react', type: 'import' }
        ],
        statementsToAppend: [
          {
            type: 'raw',
            content: `// Next.js specific Zustand utilities
export const useAuthStore = () => {
  // Next.js auth store logic
  return { user: null, isAuthenticated: false };
};

export const useUIStore = () => {
  // Next.js UI store logic
  return { theme: 'light', sidebarOpen: false };
};

export const useThemeStore = () => {
  // Next.js theme store logic
  return { mode: 'light', toggleMode: () => {} };
};

export const useNotificationStore = () => {
  // Next.js notification store logic
  return { notifications: [], addNotification: () => {} };
};

// Next.js specific store utilities
export const createStore = (initialState: any) => {
  // Next.js store creation logic
  return { ...initialState };
};

export const withPersistence = (store: any) => {
  // Next.js persistence logic
  return store;
};

export const withDevtools = (store: any) => {
  // Next.js devtools logic
  return store;
};

// Next.js specific SSR utilities
export const initializeStores = async () => {
  // Next.js store initialization logic
  console.log('Initializing Zustand stores for SSR');
};

export const getServerState = () => {
  // Next.js server state logic
  return {};
};`
          }
        ]
      },
      condition: '{{#if integration.features.authStore}}'
    },

    // Add Next.js-specific store files
    {
      type: 'CREATE_FILE',
      path: 'src/lib/stores/ssr.ts',
      content: `import { create } from 'zustand';

// Next.js SSR utilities for Zustand
export async function initializeStores() {
  // Initialize stores on the server side
  console.log('Initializing Zustand stores for SSR');
}

export function getServerState() {
  // Get server-side state for hydration
  return {};
}
`,
      condition: '{{#if integration.features.ssr}}'
    },

    {
      type: 'CREATE_FILE',
      path: 'src/lib/stores/hydration.ts',
      content: `'use client';

import { useEffect, useState } from 'react';

// Next.js hydration utilities for Zustand
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
`,
      condition: '{{#if integration.features.hydration}}'
    }
  ]
};

export const blueprint = zustandNextjsIntegrationBlueprint;