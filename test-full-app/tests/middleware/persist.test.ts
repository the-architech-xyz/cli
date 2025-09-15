import { vi } from 'vitest'
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
