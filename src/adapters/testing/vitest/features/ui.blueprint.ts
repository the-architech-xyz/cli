/**
 * Vitest UI Feature Blueprint
 * 
 * Adds interactive web-based test runner interface
 */

import { Blueprint } from '../../../../types/adapter.js';

const uiBlueprint: Blueprint = {
  id: 'vitest-ui',
  name: 'Vitest UI',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['@vitest/ui'],
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
    environment: '{{module.parameters.environment}}',
    setupFiles: ['./src/test/setup.ts'],
    {{#if module.parameters.watch}}
    watch: true,
    {{/if}}
    {{#if module.parameters.coverage}}
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    {{/if}}
    ui: {
      port: {{module.parameters.port}},
      open: {{module.parameters.open}}
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
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
    },
    {
      type: 'ADD_SCRIPT',
      name: 'test:ui',
      command: 'vitest --ui --port {{module.parameters.port}}'
    },
    {
      type: 'ADD_SCRIPT',
      name: 'test:coverage',
      command: 'vitest run --coverage',
      condition: '{{#if module.parameters.coverage}}'
    },
    {
      type: 'CREATE_FILE',
      path: 'src/__tests__/ui-demo.test.tsx',
      content: `import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../test/utils'

// Demo component for UI testing
const Counter = ({ initialValue = 0 }: { initialValue?: number }) => {
  const [count, setCount] = React.useState(initialValue)
  
  return (
    <div>
      <span data-testid="count">{count}</span>
      <button 
        data-testid="increment" 
        onClick={() => setCount(count + 1)}
      >
        Increment
      </button>
      <button 
        data-testid="decrement" 
        onClick={() => setCount(count - 1)}
      >
        Decrement
      </button>
    </div>
  )
}

describe('Counter Component (UI Demo)', () => {
  it('should render initial value', () => {
    render(<Counter initialValue={5} />)
    expect(screen.getByTestId('count')).toHaveTextContent('5')
  })

  it('should increment count', () => {
    render(<Counter />)
    const incrementBtn = screen.getByTestId('increment')
    const count = screen.getByTestId('count')
    
    fireEvent.click(incrementBtn)
    expect(count).toHaveTextContent('1')
  })

  it('should decrement count', () => {
    render(<Counter initialValue={3} />)
    const decrementBtn = screen.getByTestId('decrement')
    const count = screen.getByTestId('count')
    
    fireEvent.click(decrementBtn)
    expect(count).toHaveTextContent('2')
  })

  it('should handle multiple clicks', () => {
    render(<Counter />)
    const incrementBtn = screen.getByTestId('increment')
    const count = screen.getByTestId('count')
    
    fireEvent.click(incrementBtn)
    fireEvent.click(incrementBtn)
    fireEvent.click(incrementBtn)
    
    expect(count).toHaveTextContent('3')
  })
})`
    }
  ]
};
export default uiBlueprint;
