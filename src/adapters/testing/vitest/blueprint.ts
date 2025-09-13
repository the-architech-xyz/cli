/**
 * Vitest Testing Blueprint
 * 
 * Sets up Vitest testing framework with coverage
 */

import { Blueprint } from '../../../types/adapter.js';

export const vitestBlueprint: Blueprint = {
  id: 'vitest-base-setup',
  name: 'Vitest Base Setup',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['vitest', '@vitejs/plugin-react', 'jsdom', '@testing-library/react', '@testing-library/jest-dom', '@testing-library/user-event', '@types/react', '@types/react-dom'],
      isDev: true
    },
    {
      type: 'CREATE_FILE',
      path: 'vitest.config.ts',
      content: `/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})`
    },
    {
      type: 'CREATE_FILE',
      path: 'tests/setup/setup.ts',
      content: `import '@testing-library/jest-dom'
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
}))`
    },
    {
      type: 'CREATE_FILE',
      path: 'tests/setup/utils.tsx',
      content: `import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Mock providers wrapper
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }`
    },
    {
      type: 'CREATE_FILE',
      path: 'tests/unit/example.test.tsx',
      content: `import { describe, it, expect } from 'vitest'
import { render, screen } from '../setup/utils'

describe('Example Test', () => {
  it('should render hello world', () => {
    render(<div>Hello World</div>)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})`
    },
    {
      type: 'ADD_SCRIPT',
      name: 'test',
      command: 'vitest'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'test:run',
      command: 'vitest run'
    }
  ]
};
