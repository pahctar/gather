import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimeoutError, TIMEOUT_MESSAGE, fetchWithTimeout, withTimeout } from './timeout'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('withTimeout', () => {
  it('resolves when the promise settles in time', async () => {
    await expect(withTimeout(Promise.resolve(42), 50)).resolves.toBe(42)
  })

  it('passes through rejections', async () => {
    await expect(withTimeout(Promise.reject(new Error('boom')), 50)).rejects.toThrow('boom')
  })

  it('rejects with a clear message when the promise hangs', async () => {
    vi.useFakeTimers()
    const p = withTimeout(new Promise(() => {}), 1000)
    vi.advanceTimersByTime(1000)
    await expect(p).rejects.toBeInstanceOf(TimeoutError)
    await expect(p).rejects.toThrow(TIMEOUT_MESSAGE)
  })
})

describe('fetchWithTimeout', () => {
  it('aborts a hanging request and throws TimeoutError', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      (_: unknown, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
    )
    const p = fetchWithTimeout('https://example.test', {}, 500)
    vi.advanceTimersByTime(500)
    await expect(p).rejects.toBeInstanceOf(TimeoutError)
  })

  it('returns the response when fetch succeeds', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('ok')))
    const res = await fetchWithTimeout('https://example.test', {}, 500)
    await expect(res.text()).resolves.toBe('ok')
  })
})
