/**
 * Zustand Persistence Feature Blueprint
 * 
 * Persist state to localStorage, sessionStorage, or custom storage
 */

import { Blueprint } from '../../../../types/adapter.js';

const persistenceBlueprint: Blueprint = {
  id: 'zustand-persistence',
  name: 'State Persistence',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'src/lib/stores/use-app-store.ts',
      content: `import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  persist(
    (set) => ({
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
    }),
    {
      name: 'app-store',
      {{#if module.parameters.storage}}
      storage: {{module.parameters.storage}},
      {{/if}}
      {{#if module.parameters.encryption}}
      encrypt: true,
      {{/if}}
      partialize: (state) => ({
        user: state.user,
        ui: { theme: state.ui.theme },
      }),
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
      path: 'src/lib/storage/custom-storage.ts',
      content: `import { StateStorage } from 'zustand/middleware';

/**
 * Custom storage implementation for Zustand persistence
 */
export class CustomStorage implements StateStorage {
  private storage: Map<string, string> = new Map();

  getItem(name: string): string | null {
    return this.storage.get(name) || null;
  }

  setItem(name: string, value: string): void {
    this.storage.set(name, value);
  }

  removeItem(name: string): void {
    this.storage.delete(name);
  }
}

/**
 * IndexedDB storage implementation
 */
export class IndexedDBStorage implements StateStorage {
  private dbName: string;
  private storeName: string;

  constructor(dbName: string = 'zustand-storage', storeName: string = 'stores') {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async getItem(name: string): Promise<string | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(name);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
      });
    } catch (error) {
      console.error('IndexedDB getItem error:', error);
      return null;
    }
  }

  async setItem(name: string, value: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(value, name);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('IndexedDB setItem error:', error);
    }
  }

  async removeItem(name: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(name);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('IndexedDB removeItem error:', error);
    }
  }
}

/**
 * Encrypted storage wrapper
 */
export class EncryptedStorage implements StateStorage {
  private storage: StateStorage;
  private encryptionKey: string;

  constructor(storage: StateStorage, encryptionKey: string) {
    this.storage = storage;
    this.encryptionKey = encryptionKey;
  }

  private encrypt(data: string): string {
    // Simple encryption - in production, use a proper encryption library
    return btoa(data + this.encryptionKey);
  }

  private decrypt(encryptedData: string): string {
    try {
      const decrypted = atob(encryptedData);
      return decrypted.slice(0, -this.encryptionKey.length);
    } catch (error) {
      console.error('Decryption error:', error);
      return '';
    }
  }

  getItem(name: string): string | null {
    const encrypted = this.storage.getItem(name);
    return encrypted ? this.decrypt(encrypted) : null;
  }

  setItem(name: string, value: string): void {
    const encrypted = this.encrypt(value);
    this.storage.setItem(name, encrypted);
  }

  removeItem(name: string): void {
    this.storage.removeItem(name);
  }
}

// Storage factory
export function createStorage(type: string, options?: any): StateStorage {
  switch (type) {
    case 'localStorage':
      return {
        getItem: (name: string) => localStorage.getItem(name),
        setItem: (name: string, value: string) => localStorage.setItem(name, value),
        removeItem: (name: string) => localStorage.removeItem(name),
      };
    
    case 'sessionStorage':
      return {
        getItem: (name: string) => sessionStorage.getItem(name),
        setItem: (name: string, value: string) => sessionStorage.setItem(name, value),
        removeItem: (name: string) => sessionStorage.removeItem(name),
      };
    
    case 'indexedDB':
      return new IndexedDBStorage(options?.dbName, options?.storeName);
    
    case 'custom':
      return new CustomStorage();
    
    default:
      throw new Error(\`Unsupported storage type: \${type}\`);
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/lib/stores/use-persisted-store.ts',
      content: `import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createStorage } from '../storage/custom-storage.js';

interface PersistedState {
  data: any;
  lastUpdated: number;
  version: string;
}

interface PersistedStore {
  state: PersistedState;
  setData: (data: any) => void;
  clearData: () => void;
  getLastUpdated: () => Date;
  isExpired: (ttl: number) => boolean;
}

export function createPersistedStore(
  name: string,
  storageType: string = 'localStorage',
  options?: any
) {
  return create<PersistedStore>()(
    persist(
      (set, get) => ({
        state: {
          data: null,
          lastUpdated: Date.now(),
          version: '1.0.0',
        },
        
        setData: (data) =>
          set((state) => ({
            state: {
              ...state.state,
              data,
              lastUpdated: Date.now(),
            },
          })),
        
        clearData: () =>
          set((state) => ({
            state: {
              ...state.state,
              data: null,
              lastUpdated: Date.now(),
            },
          })),
        
        getLastUpdated: () => {
          const state = get().state;
          return new Date(state.lastUpdated);
        },
        
        isExpired: (ttl: number) => {
          const state = get().state;
          return Date.now() - state.lastUpdated > ttl;
        },
      }),
      {
        name,
        storage: createStorage(storageType, options),
        partialize: (state) => ({ state }),
      }
    )
  );
}

// Example usage
export const useUserPreferencesStore = createPersistedStore(
  'user-preferences',
  'localStorage'
);

export const useSessionStore = createPersistedStore(
  'session-data',
  'sessionStorage'
);

export const useOfflineStore = createPersistedStore(
  'offline-data',
  'indexedDB',
  { dbName: 'offline-storage', storeName: 'data' }
);`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/hooks/use-persistence.ts',
      content: `import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/use-app-store.js';

export function usePersistence() {
  const [isHydrated, setIsHydrated] = useState(false);
  const store = useAppStore();

  useEffect(() => {
    // Mark as hydrated after the store has been rehydrated
    const unsubscribe = store.persist?.onFinishHydration(() => {
      setIsHydrated(true);
    });

    return () => {
      unsubscribe?.();
    };
  }, [store.persist]);

  const clearStorage = () => {
    store.persist?.clearStorage();
  };

  const rehydrate = () => {
    store.persist?.rehydrate();
  };

  const getStorage = () => {
    return store.persist?.getStorage();
  };

  return {
    isHydrated,
    clearStorage,
    rehydrate,
    getStorage,
  };
}

export function useStorageSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isHydrated } = usePersistence();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isHydrated,
    canSync: isOnline && isHydrated,
  };
}`
    }
  ]
};
export default persistenceBlueprint;
