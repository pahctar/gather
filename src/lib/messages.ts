// All user-facing auth messages in one place (approved draft text).
import { TIMEOUT_MESSAGE } from './timeout'

export const PASSWORD_MIN = 8

export const MSG = {
  // Log-in
  emailInvalid: 'Enter a valid email address.',
  passwordRequired: 'Enter your password.',
  wrongCredentials: 'Incorrect email or password.',
  emailNotConfirmed: 'Please confirm your email first — check your inbox.',

  // Sign-up
  usernameFormat: 'Usernames can use 3–20 lowercase letters, numbers or _.',
  usernameTaken: 'That username is taken.',
  passwordShort: `Password must be at least ${PASSWORD_MIN} characters.`,
  passwordHint: `At least ${PASSWORD_MIN} characters`,
  passwordMismatch: "Passwords don't match.",
  emailTaken: 'An account with this email already exists.',
  /** Supabase password rules stricter than ours (dashboard setting). */
  passwordRejected:
    'This password was rejected by the server’s password rules. (Supabase → Authentication → Email: set “Password requirements” to “No required characters”.)',
  passwordPwned: 'This password has appeared in a data breach. Please choose a different one.',
  signupsDisabled: 'Sign-ups are turned off for this project.',
  /** Supabase's built-in email only delivers to members of the Supabase organization. */
  emailNotAuthorized:
    "Supabase can't send email to this address yet. For testing, use the email of your Supabase account, or set up SMTP (see README).",
  emailSendFailed: "We couldn't send the confirmation email. Try again later.",
  dbNotSetUp: "The database isn't set up yet. Run the Supabase migrations (see README).",

  // Create profile
  nameRequired: 'Name is required.',
  dobIncomplete: 'Enter a full date of birth, or leave it blank.',
  dobInvalid: 'Enter a real date of birth.',
  photoInvalid: 'Photos must be JPG, PNG or WebP, up to 5 MB.',
  photoUpload: "Couldn't upload the photo. Try again.",
  profileLoad: "Couldn't load your profile.",
  profileMissingTable: 'The profiles table is missing. Run the Supabase migrations (see README).',
  tryAgain: 'Try again',

  // Shared
  timeout: TIMEOUT_MESSAGE,
  network: "Can't reach the server. Check your connection and try again.",
  rateLimited: 'Too many attempts. Wait a minute and try again.',
  notConfigured: "Gather isn't connected to Supabase yet. Add your keys to .env.local and restart the dev server.",
  unknown: 'Something went wrong. Please try again.',
} as const
