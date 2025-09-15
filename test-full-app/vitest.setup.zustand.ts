import { vi } from 'vitest'

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
