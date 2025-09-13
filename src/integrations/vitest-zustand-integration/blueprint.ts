import { Blueprint } from '../../types/adapter.js';

const vitestZustandIntegrationBlueprint: Blueprint = {
  id: 'vitest-zustand-integration',
  name: 'Vitest Zustand Integration',
  description: 'Complete Vitest testing setup for Zustand state management',
  version: '1.0.0',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'vitest.config.zustand.ts',
      condition: '{{#if integration.features.storeTesting}}',
      content: `import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.zustand.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test-utils/**',
        '**/tests/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules/', 'dist/', 'coverage/']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/test-utils': path.resolve(__dirname, './test-utils')
    }
  }
})
`
    },
    {
      type: 'CREATE_FILE',
      path: 'vitest.setup.zustand.ts',
      condition: '{{#if integration.features.storeTesting}}',
      content: `import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  databases: vi.fn()
}

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB
})

// Mock Redux DevTools
const mockDevTools = {
  connect: vi.fn(() => ({
    init: vi.fn(),
    send: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn()
  })),
  disconnect: vi.fn()
}

Object.defineProperty(window, '__REDUX_DEVTOOLS_EXTENSION__', {
  value: mockDevTools
})

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()
})
`
    },
    {
      type: 'CREATE_FILE',
      path: 'test-utils/store-test-utils.ts',
      condition: '{{#if integration.features.storeTesting}}',
      content: `import { act, renderHook } from '@testing-library/react'
import { vi } from 'vitest'

export const createMockStore = <T>(initialState: T) => {
  let state = { ...initialState }
  const listeners = new Set<() => void>()

  return {
    getState: () => state,
    setState: (newState: Partial<T>) => {
      state = { ...state, ...newState }
      listeners.forEach(listener => listener())
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    reset: () => {
      state = { ...initialState }
      listeners.forEach(listener => listener())
    }
  }
}

export const renderStoreHook = <T, R>(
  hook: () => R,
  options?: { wrapper?: React.ComponentType<{ children: React.ReactNode }> }
) => {
  return renderHook(hook, options)
}

export const actAndWait = async (callback: () => void) => {
  await act(async () => {
    callback()
  })
}

export const mockStoreActions = (actions: Record<string, any>) => {
  return Object.keys(actions).reduce((acc, key) => {
    acc[key] = vi.fn(actions[key])
    return acc
  }, {} as Record<string, any>)
}
`
    },
    {
      type: 'CREATE_FILE',
      path: 'test-utils/mock-storage.ts',
      condition: '{{#if integration.features.mocking}}',
      content: `import { vi } from 'vitest'

export const createMockStorage = () => {
  const storage = new Map<string, string>()
  
  return {
    getItem: vi.fn((key: string) => storage.get(key) || null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    removeItem: vi.fn((key: string) => storage.delete(key)),
    clear: vi.fn(() => storage.clear()),
    get length() { return storage.size },
    key: vi.fn((index: number) => Array.from(storage.keys())[index] || null)
  }
}

export const mockLocalStorage = createMockStorage()
export const mockSessionStorage = createMockStorage()

export const setupStorageMocks = () => {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  })
  
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true
  })
}

export const resetStorageMocks = () => {
  mockLocalStorage.clear()
  mockSessionStorage.clear()
  vi.clearAllMocks()
}
`
    },
    {
      type: 'CREATE_FILE',
      path: 'tests/stores/auth-store.test.ts',
      condition: '{{#if integration.features.storeTesting}}',
      content: `import { renderStoreHook, actAndWait } from '@/test-utils/store-test-utils'
import { useAuthStore } from '@/stores/auth-store'

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.getState().reset()
  })

  it('should initialize with default state', () => {
    const { result } = renderStoreHook(() => useAuthStore())
    
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('should login user', async () => {
    const { result } = renderStoreHook(() => useAuthStore())
    
    await actAndWait(() => {
      result.current.login({
        id: '1',
        email: 'test@example.com',
        name: 'Test User'
      })
    })

    expect(result.current.user).toEqual({
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should logout user', async () => {
    const { result } = renderStoreHook(() => useAuthStore())
    
    // First login
    await actAndWait(() => {
      result.current.login({
        id: '1',
        email: 'test@example.com',
        name: 'Test User'
      })
    })

    // Then logout
    await actAndWait(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should set loading state', async () => {
    const { result } = renderStoreHook(() => useAuthStore())
    
    await actAndWait(() => {
      result.current.setLoading(true)
    })

    expect(result.current.isLoading).toBe(true)

    await actAndWait(() => {
      result.current.setLoading(false)
    })

    expect(result.current.isLoading).toBe(false)
  })
})
`
    },
    {
      type: 'CREATE_FILE',
      path: 'tests/middleware/persist.test.ts',
      condition: '{{#if integration.features.middlewareTesting}}',
      content: `import { vi } from 'vitest'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setupStorageMocks, resetStorageMocks } from '@/test-utils/mock-storage'

describe('Persist Middleware', () => {
  beforeEach(() => {
    setupStorageMocks()
    resetStorageMocks()
  })

  it('should persist state to localStorage', () => {
    const useStore = create(
      persist(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 }))
        }),
        {
          name: 'test-storage'
        }
      )
    )

    // Initial state should be loaded from storage
    expect(useStore.getState().count).toBe(0)

    // Update state
    useStore.getState().increment()
    expect(useStore.getState().count).toBe(1)

    // Check if state was persisted
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'test-storage',
      expect.stringContaining('"count":1')
    )
  })

  it('should restore state from localStorage', () => {
    // Mock localStorage with existing data
    const mockData = JSON.stringify({
      state: { count: 5 },
      version: 0
    })
    
    vi.mocked(localStorage.getItem).mockReturnValue(mockData)

    const useStore = create(
      persist(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 }))
        }),
        {
          name: 'test-storage'
        }
      )
    )

    // State should be restored from localStorage
    expect(useStore.getState().count).toBe(5)
  })
})
`
    },
    {
      type: 'CREATE_FILE',
      path: 'tests/persistence/localStorage.test.ts',
      condition: '{{#if integration.features.persistenceTesting}}',
      content: `import { vi } from 'vitest'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setupStorageMocks, resetStorageMocks } from '@/test-utils/mock-storage'

describe('LocalStorage Persistence', () => {
  beforeEach(() => {
    setupStorageMocks()
    resetStorageMocks()
  })

  it('should save state to localStorage', () => {
    const useStore = create(
      persist(
        (set) => ({
          data: 'test',
          setData: (data: string) => set({ data })
        }),
        {
          name: 'test-persistence',
          storage: {
            getItem: (name) => localStorage.getItem(name),
            setItem: (name, value) => localStorage.setItem(name, value),
            removeItem: (name) => localStorage.removeItem(name)
          }
        }
      )
    )

    useStore.getState().setData('updated')

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'test-persistence',
      expect.stringContaining('"data":"updated"')
    )
  })

  it('should load state from localStorage', () => {
    const mockState = JSON.stringify({
      state: { data: 'loaded' },
      version: 0
    })
    
    vi.mocked(localStorage.getItem).mockReturnValue(mockState)

    const useStore = create(
      persist(
        (set) => ({
          data: 'initial',
          setData: (data: string) => set({ data })
        }),
        {
          name: 'test-persistence',
          storage: {
            getItem: (name) => localStorage.getItem(name),
            setItem: (name, value) => localStorage.setItem(name, value),
            removeItem: (name) => localStorage.removeItem(name)
          }
        }
      )
    )

    expect(useStore.getState().data).toBe('loaded')
  })
})
`
    }
  ]
};

export const blueprint = vitestZustandIntegrationBlueprint;
