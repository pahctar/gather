import type { ButtonHTMLAttributes, ReactNode } from 'react'
import googleIcon from '../../assets/figma/icon-google.svg'

type PrimaryProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean
  loadingText?: string
  children: ReactNode
}

/**
 * Figma "Button": 45px tall, 15px corners, inset bottom shadow.
 * Light: Whisper White fill. Dark: Lucious Lime fill. Text: Dark Hunter Green.
 * Hover: placeholder (brightness) until the Figma hover variants can be read
 * (docs/decisions.md A3).
 */
export function PrimaryButton({ loading, loadingText, children, className = '', disabled, ...rest }: PrimaryProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={
        'block h-[45px] w-full rounded-input bg-whisper text-[17px] font-bold text-hunter shadow-button transition ' +
        'hover:brightness-[0.97] active:translate-y-px active:shadow-none ' +
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-bright ' +
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100 disabled:active:translate-y-0 ' +
        'dark:bg-lime dark:hover:brightness-105 dark:focus-visible:ring-offset-bokara ' +
        className
      }
    >
      {loading ? (loadingText ?? children) : children}
    </button>
  )
}

/**
 * "Continue with Google". Disabled placeholder until Google sign-in is set up
 * (brief: Google comes last). Keeps the Figma look; not clickable.
 */
export function GoogleButton() {
  return (
    <button
      type="button"
      disabled
      title="Google sign-in is coming soon"
      aria-label="Continue with Google (coming soon)"
      className={
        'flex h-[45px] w-full cursor-not-allowed items-center justify-center gap-3 rounded-input border-2 ' +
        'border-whisper bg-bright text-[17px] font-bold text-black ' +
        'dark:border-[rgba(233,248,211,0.2)] dark:bg-bokara dark:text-bright'
      }
    >
      <img src={googleIcon} alt="" aria-hidden width={20} height={20} />
      <span>Continue with Google</span>
    </button>
  )
}

/** "—— or ——" separator. Lines: 2px, round caps, Bokara/Whisper at 25% (from the Figma SVGs). */
export function OrDivider() {
  return (
    <div className="flex items-center gap-[11px]" role="separator" aria-label="or">
      <span className="h-0.5 flex-1 rounded-full bg-bokara/25 dark:bg-whisper/25" />
      <span aria-hidden className="text-[15px] font-bold text-bokara/70 dark:text-whisper/70">
        or
      </span>
      <span className="h-0.5 flex-1 rounded-full bg-bokara/25 dark:bg-whisper/25" />
    </div>
  )
}

/** Form-level error (e.g. wrong password, timeout). Announced by screen readers. */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="rounded-input border-2 border-error/30 bg-error/5 px-4 py-2.5 text-center text-[14px] font-bold text-error dark:border-error-dark/30 dark:bg-error-dark/10 dark:text-error-dark"
    >
      {message}
    </p>
  )
}
