// All user-facing auth messages in one place (approved draft text).
import { TIMEOUT_MESSAGE } from './timeout'

export const MSG = {
  emailInvalid: 'Enter a valid email address.',
  passwordRequired: 'Enter your password.',
  wrongCredentials: 'Incorrect email or password.',
  emailNotConfirmed: 'Please confirm your email first — check your inbox.',
  timeout: TIMEOUT_MESSAGE,
  network: "Can't reach the server. Check your connection and try again.",
  rateLimited: 'Too many attempts. Wait a minute and try again.',
  notConfigured: "Gather isn't connected to Supabase yet. Add your keys to .env.local and restart the dev server.",
  unknown: 'Something went wrong. Please try again.',
} as const
