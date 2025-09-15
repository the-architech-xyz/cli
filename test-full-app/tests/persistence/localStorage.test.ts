import { vi } from 'vitest'
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
