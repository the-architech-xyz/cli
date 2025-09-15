import { renderStoreHook, actAndWait } from '@/test-utils/store-test-utils'
import { useAuthStore } from '@/stores/auth-store'

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.getState().reset()
  })

  it('should initialize with default state', () => {
    const { result } = renderStoreHook(() => useAuthStore())
    
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('should login user', async () => {
    const { result } = renderStoreHook(() => useAuthStore())
    
    await actAndWait(() => {
      result.current.login({
        id: '1',
        email: 'test@example.com',
        name: 'Test User'
      })
    })

    expect(result.current.user).toEqual({
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should logout user', async () => {
    const { result } = renderStoreHook(() => useAuthStore())
    
    // First login
    await actAndWait(() => {
      result.current.login({
        id: '1',
        email: 'test@example.com',
        name: 'Test User'
      })
    })

    // Then logout
    await actAndWait(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should set loading state', async () => {
    const { result } = renderStoreHook(() => useAuthStore())
    
    await actAndWait(() => {
      result.current.setLoading(true)
    })

    expect(result.current.isLoading).toBe(true)

    await actAndWait(() => {
      result.current.setLoading(false)
    })

    expect(result.current.isLoading).toBe(false)
  })
})
