export const REQUEST_TIMEOUT_MS = 15_000

export const TIMEOUT_MESSAGE =
  "The server didn't respond in time. Check your connection and try again."

export class TimeoutError extends Error {
  constructor() {
    super(TIMEOUT_MESSAGE)
    this.name = 'TimeoutError'
  }
}

/**
 * fetch() that aborts after `ms`. Uses AbortController + setTimeout rather than
 * AbortSignal.timeout()/AbortSignal.any(), which older Safari versions lack.
 */
export function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  ms = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController()
  const outer = init.signal
  let timedOut = false

  const onOuterAbort = () => controller.abort()
  if (outer) {
    if (outer.aborted) controller.abort()
    else outer.addEventListener('abort', onOuterAbort, { once: true })
  }

  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, ms)

  return fetch(input, { ...init, signal: controller.signal })
    .catch((err: unknown) => {
      if (timedOut) throw new TimeoutError()
      throw err
    })
    .finally(() => {
      clearTimeout(timer)
      outer?.removeEventListener('abort', onOuterAbort)
    })
}

/** Rejects with TimeoutError if `promise` doesn't settle within `ms`. */
export function withTimeout<T>(promise: PromiseLike<T>, ms = REQUEST_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms)
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err: unknown) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}
