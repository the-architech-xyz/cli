import { vi } from 'vitest'

export const mockRouter = {
  route: '/',
  pathname: '/',
  query: {},
  asPath: '/',
  push: vi.fn(),
  pop: vi.fn(),
  reload: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
  beforePopState: vi.fn(),
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn()
  }
}

export const mockUseRouter = () => mockRouter
