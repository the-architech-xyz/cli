import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock common framework utilities
// These mocks will be overridden by framework-specific integration adapters
vi.mock('@/lib/router', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))
