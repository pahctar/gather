import { isAuthError, isAuthWeakPasswordError } from '@supabase/supabase-js'
import { MSG } from './messages'
import { TimeoutError } from './timeout'

/** Errors any auth call can produce: timeout, offline, rate limit. */
function commonMessage(err: unknown): string | undefined {
  if (err instanceof TimeoutError) return MSG.timeout
  if (isAuthError(err)) {
    if (err.code === 'over_request_rate_limit' || err.code === 'over_email_send_rate_limit') return MSG.rateLimited
    if (err.status === 429) return MSG.rateLimited
    // AuthRetryableFetchError: network failure (status 0) or 5xx.
    if (err.name === 'AuthRetryableFetchError') {
      // Our fetch wrapper's TimeoutError gets wrapped by supabase-js.
      return err.message === MSG.timeout ? MSG.timeout : MSG.network
    }
  }
  if (err instanceof TypeError) return MSG.network // fetch() network failure
  return undefined
}

/**
 * Turns anything thrown or returned by signInWithPassword into one of the
 * approved messages. Never shows raw server text to the user.
 */
export function loginErrorMessage(err: unknown): string {
  if (isAuthError(err)) {
    if (err.code === 'invalid_credentials') return MSG.wrongCredentials
    if (err.code === 'email_not_confirmed') return MSG.emailNotConfirmed
  }
  const common = commonMessage(err)
  if (common) return common
  if (isAuthError(err)) {
    // Older GoTrue versions without error codes.
    if (/invalid login credentials/i.test(err.message)) return MSG.wrongCredentials
    if (/email not confirmed/i.test(err.message)) return MSG.emailNotConfirmed
  }
  return MSG.unknown
}

export type SignupErrorResult = { field?: 'email' | 'password' | 'username'; message: string }

/** Short code shown after "Something went wrong" so unknown failures can be diagnosed. */
function errorCode(err: unknown): string {
  const e = err as { code?: unknown; status?: unknown; name?: unknown } | null
  const parts = [e?.code, e?.status].filter((v) => v !== undefined && v !== null && v !== '')
  return parts.length ? parts.join(' / ') : String(e?.name ?? 'unknown')
}

/** PostgREST error from calling username_available(): function or table missing. */
function isDatabaseSetupError(err: unknown): boolean {
  const code = (err as { code?: unknown } | null)?.code
  return code === 'PGRST202' || code === 'PGRST205' || code === '42883' || code === '42P01'
}

/** Same for signUp. `field` says which input the message belongs under. */
export function signupErrorMessage(err: unknown): SignupErrorResult {
  if (isDatabaseSetupError(err)) return { message: MSG.dbNotSetUp }
  if (isAuthWeakPasswordError(err)) {
    if (err.reasons.includes('pwned')) return { field: 'password', message: MSG.passwordPwned }
    if (err.reasons.includes('length')) return { field: 'password', message: MSG.passwordShort }
    return { field: 'password', message: MSG.passwordRejected }
  }
  if (isAuthError(err)) {
    switch (err.code) {
      case 'user_already_exists':
      case 'email_exists':
        return { field: 'email', message: MSG.emailTaken }
      case 'email_address_invalid':
      case 'validation_failed':
        return { field: 'email', message: MSG.emailInvalid }
      case 'signup_disabled':
      case 'email_provider_disabled':
        return { message: MSG.signupsDisabled }
      case 'email_address_not_authorized':
        return { field: 'email', message: MSG.emailNotAuthorized }
    }
    if (/error sending confirmation (email|mail)/i.test(err.message)) return { message: MSG.emailSendFailed }
  }
  const common = commonMessage(err)
  if (common) return { message: common }
  return { message: `${MSG.unknown} (${errorCode(err)})` }
}
