import { act, renderHook } from '@testing-library/react'
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
