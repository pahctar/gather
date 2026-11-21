import { MSG, PASSWORD_MIN } from './messages'

// Pragmatic check: something@something.tld, no spaces. Supabase validates too.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Same rule as the database constraint `username_format`. */
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/

export function validateEmail(email: string): string | undefined {
  return EMAIL_RE.test(email.trim()) ? undefined : MSG.emailInvalid
}

export function validateLoginPassword(password: string): string | undefined {
  return password.length > 0 ? undefined : MSG.passwordRequired
}

/** Usernames are typed lower-case (the input lower-cases as you type). */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase()
}

export function validateUsername(username: string): string | undefined {
  return USERNAME_RE.test(username) ? undefined : MSG.usernameFormat
}

/** Minimum 8 characters, nothing else (brief). Counts characters, not bytes. */
export function validateNewPassword(password: string): string | undefined {
  return Array.from(password).length >= PASSWORD_MIN ? undefined : MSG.passwordShort
}

export function validatePasswordConfirm(password: string, confirm: string): string | undefined {
  return password === confirm ? undefined : MSG.passwordMismatch
}
