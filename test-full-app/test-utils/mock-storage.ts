import { vi } from 'vitest'

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
