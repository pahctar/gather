import { MSG } from './messages'

// Pragmatic check: something@something.tld, no spaces. Supabase validates too.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | undefined {
  return EMAIL_RE.test(email.trim()) ? undefined : MSG.emailInvalid
}

export function validateLoginPassword(password: string): string | undefined {
  return password.length > 0 ? undefined : MSG.passwordRequired
}
