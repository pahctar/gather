import { isAuthError } from '@supabase/supabase-js'
import { MSG } from './messages'
import { TimeoutError } from './timeout'

/**
 * Turns anything thrown or returned by a Supabase auth call into one of the
 * approved messages. Never shows raw server text to the user.
 */
export function loginErrorMessage(err: unknown): string {
  if (err instanceof TimeoutError) return MSG.timeout

  if (isAuthError(err)) {
    switch (err.code) {
      case 'invalid_credentials':
        return MSG.wrongCredentials
      case 'email_not_confirmed':
        return MSG.emailNotConfirmed
      case 'over_request_rate_limit':
      case 'over_email_send_rate_limit':
        return MSG.rateLimited
    }
    if (err.status === 429) return MSG.rateLimited
    // AuthRetryableFetchError: network failure (status 0) or 5xx.
    if (err.name === 'AuthRetryableFetchError') {
      // Our fetch wrapper's TimeoutError gets wrapped by supabase-js.
      if (err.message === MSG.timeout) return MSG.timeout
      return MSG.network
    }
    // Older GoTrue versions without error codes.
    if (/invalid login credentials/i.test(err.message)) return MSG.wrongCredentials
    if (/email not confirmed/i.test(err.message)) return MSG.emailNotConfirmed
  }

  if (err instanceof TypeError) return MSG.network // fetch() network failure
  return MSG.unknown
}
