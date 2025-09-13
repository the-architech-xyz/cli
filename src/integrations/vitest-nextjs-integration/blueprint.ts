import { Blueprint } from '../../types/adapter.js';

const vitestNextjsIntegrationBlueprint: Blueprint = {
  id: 'vitest-nextjs-integration',
  name: 'Vitest Next.js Integration',
  description: 'Complete Vitest testing setup for Next.js applications',
  version: '1.0.0',
  actions: [
    {
      type: 'CREATE_FILE',
      path: 'vitest.config.ts',
      condition: '{{#if integration.features.unitTesting}}',
      content: `import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    teardownFiles: ['./vitest.teardown.ts'],
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
    include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules/', 'dist/', 'coverage/']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils')
    }
  }
})
`
    },
    {
      type: 'CREATE_FILE',
      path: 'vitest.setup.ts',
      condition: '{{#if integration.features.unitTesting}}',
      content: `import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
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
  })
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams()
}))

// Mock fetch
global.fetch = vi.fn()

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))
`
    },
    {
      type: 'CREATE_FILE',
      path: 'test-utils/test-utils.tsx',
      condition: '{{#if integration.features.unitTesting}}',
      content: `import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </ThemeProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
`
    },
    {
      type: 'CREATE_FILE',
      path: 'test-utils/mock-next-router.ts',
      condition: '{{#if integration.features.mocking}}',
      content: `import { vi } from 'vitest'

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
`
    },
    {
      type: 'CREATE_FILE',
      path: 'test-utils/mock-fetch.ts',
      condition: '{{#if integration.features.mocking}}',
      content: `import { vi } from 'vitest'

export const mockFetch = (data: any, ok = true) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request'
  })
}

export const mockFetchError = (error: string) => {
  global.fetch = vi.fn().mockRejectedValue(new Error(error))
}

export const resetFetch = () => {
  vi.restoreAllMocks()
}
`
    },
    {
      type: 'CREATE_FILE',
      path: 'tests/unit/components/Button.test.tsx',
      condition: '{{#if integration.features.unitTesting}}',
      content: `import { render, screen, fireEvent } from '@/test-utils/test-utils'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant styles correctly', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })

  it('applies size styles correctly', () => {
    render(<Button size="lg">Large Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-11')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
})
`
    },
    {
      type: 'CREATE_FILE',
      path: 'tests/integration/pages/home.test.tsx',
      condition: '{{#if integration.features.integrationTesting}}',
      content: `import { render, screen } from '@/test-utils/test-utils'
import HomePage from '@/app/page'

// Mock Next.js page component
const MockHomePage = () => (
  <div>
    <h1>Welcome to Next.js</h1>
    <p>Get started by editing pages/index.js</p>
  </div>
)

describe('Home Page', () => {
  it('renders welcome message', () => {
    render(<MockHomePage />)
    expect(screen.getByText('Welcome to Next.js')).toBeInTheDocument()
  })

  it('renders get started text', () => {
    render(<MockHomePage />)
    expect(screen.getByText('Get started by editing pages/index.js')).toBeInTheDocument()
  })
})
`
    },
    {
      type: 'CREATE_FILE',
      path: 'tests/e2e/auth.spec.ts',
      condition: '{{#if integration.features.e2eTesting}}',
      content: `import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email"]', 'invalid@example.com')
    await page.fill('[data-testid="password"]', 'wrongpassword')
    await page.click('[data-testid="login-button"]')
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
  })
})
`
    }
  ]
};

export const blueprint = vitestNextjsIntegrationBlueprint;
