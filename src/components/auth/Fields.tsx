import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react'
import keyLight from '../../assets/figma/icon-key-light.svg'
import keyDark from '../../assets/figma/icon-key-dark.svg'
import eyeOpenLight from '../../assets/figma/icon-eye-open-light.svg'
import eyeOpenDark from '../../assets/figma/icon-eye-open-dark.svg'
import eyeCloseLight from '../../assets/figma/icon-eye-close-light.svg'
import eyeCloseDark from '../../assets/figma/icon-eye-close-dark.svg'

export type IconPair = {
  light: string
  dark: string
  /** Light icons whose 15% opacity lives on the Figma instance, not in the SVG. */
  lightNeedsOpacity?: boolean
}

export function ThemedIcon({ icon, className = '' }: { icon: IconPair; className?: string }) {
  return (
    <>
      <img
        src={icon.light}
        alt=""
        aria-hidden
        width={15}
        height={13}
        className={`dark:hidden ${icon.lightNeedsOpacity ? 'opacity-15' : ''} ${className}`}
      />
      <img src={icon.dark} alt="" aria-hidden width={15} height={13} className={`hidden dark:block ${className}`} />
    </>
  )
}

const inputBase =
  'block h-[45px] w-full appearance-none rounded-input border-2 bg-bright pl-[50px] text-[17px] font-bold text-bokara ' +
  'placeholder:text-bokara/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-0 ' +
  'dark:bg-bokara dark:text-bright dark:placeholder:text-bright/15 ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

function borderClasses(invalid: boolean, darkBorder: string) {
  return invalid
    ? 'border-error dark:border-error-dark'
    : `border-whisper focus:border-lime ${darkBorder} dark:focus:border-lime`
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon?: IconPair
  error?: string
  hint?: string
}

export function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <p id={id} className="mt-1.5 pl-0.5 text-[12px] font-bold text-error dark:text-error-dark">
        {error}
      </p>
    )
  }
  if (hint) {
    return (
      <p id={id} className="mt-1.5 pl-0.5 text-[12px] font-medium text-bokara/70 dark:text-whisper/70">
        {hint}
      </p>
    )
  }
  return null
}

/** Text input matching Figma "Email Input" (400×45, 15px corners, left icon). */
export const TextField = forwardRef<HTMLInputElement, FieldProps>(function TextField(
  { label, icon, error, hint, className = '', id, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const msgId = `${inputId}-msg`
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-[4px] block pl-0.5 text-[12px] font-medium text-bokara dark:text-whisper">
        {label}
      </label>
      <div className="relative">
        {icon && <ThemedIcon icon={icon} className="pointer-events-none absolute left-5 top-[17px]" />}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? msgId : undefined}
          className={`${inputBase} pr-5 ${borderClasses(Boolean(error), 'dark:border-lime/25')}`}
          {...rest}
        />
      </div>
      <FieldMessage id={msgId} error={error} hint={hint} />
    </div>
  )
})

/** Figma "Password Input": key icon on the left, eye show/hide toggle on the right. */
export const PasswordField = forwardRef<HTMLInputElement, Omit<FieldProps, 'icon' | 'type'>>(function PasswordField(
  { label, error, hint, className = '', id, ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const autoId = useId()
  const inputId = id ?? autoId
  const msgId = `${inputId}-msg`
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-[4px] block pl-0.5 text-[12px] font-medium text-bokara dark:text-whisper">
        {label}
      </label>
      <div className="relative">
        <ThemedIcon
          icon={{ light: keyLight, dark: keyDark, lightNeedsOpacity: true }}
          className="pointer-events-none absolute left-5 top-[17px]"
        />
        <input
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? msgId : undefined}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={`${inputBase} pr-[50px] ${borderClasses(Boolean(error), 'dark:border-lime/20')}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          aria-controls={inputId}
          className="absolute right-[10px] top-1/2 flex h-[35px] w-[35px] -translate-y-1/2 items-center justify-center rounded-[10px] focus:outline-none focus-visible:ring-2 focus-visible:ring-lime"
        >
          <ThemedIcon
            icon={
              visible
                ? { light: eyeOpenLight, dark: eyeOpenDark, lightNeedsOpacity: true }
                : { light: eyeCloseLight, dark: eyeCloseDark, lightNeedsOpacity: true }
            }
          />
        </button>
      </div>
      <FieldMessage id={msgId} error={error} hint={hint} />
    </div>
  )
})
