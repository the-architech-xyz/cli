import { vi } from 'vitest'

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
