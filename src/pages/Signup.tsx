import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthCard, AuthLayout } from '../components/auth/AuthLayout'
import { FormError, GoogleButton, OrDivider, PrimaryButton } from '../components/auth/Buttons'
import { PasswordField, TextField } from '../components/auth/Fields'
import { FeatureCards } from '../components/auth/FeatureCards'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { withTimeout } from '../lib/timeout'
import { signupErrorMessage } from '../lib/authErrors'
import { MSG } from '../lib/messages'
import { isUsernameAvailable } from '../lib/username'
import {
  normalizeUsername,
  validateEmail,
  validateNewPassword,
  validatePasswordConfirm,
  validateUsername,
} from '../lib/validation'
import heroBase from '../assets/raster/hero-gather-base@3x.png'
import heroLight from '../assets/raster/hero-gather-light@3x.png'
import heroDark from '../assets/raster/hero-gather-dark@3x.png'
import userLight from '../assets/figma/icon-user-light.svg'
import userDark from '../assets/figma/icon-user-dark.svg'
import emailLight from '../assets/figma/icon-email-light.svg'
import emailDark from '../assets/figma/icon-email-dark.svg'

type Field = 'username' | 'email' | 'password' | 'confirm'
type FieldErrors = Partial<Record<Field, string>>

/**
 * "Let's gather" + tagline. Figma size (90px / 337×106 artwork) from xl (1280px)
 * up, a smaller centred version below that.
 */
function Hero() {
  const img = 'absolute inset-0 h-full w-full'
  return (
    <div className="text-center xl:text-left">
      <h1 className="flex items-start justify-center gap-3 text-[52px] font-bold leading-[70px] text-bokara xl:ml-[50px] xl:justify-start xl:gap-[30px] xl:text-[90px] xl:leading-[121px] dark:text-whisper">
        <span>Let’s</span>
        <span className="relative mt-[8px] block h-[60px] w-[190px] shrink-0 xl:mt-[11px] xl:h-[106px] xl:w-[337px]">
          <img src={heroBase} alt="" aria-hidden width={337} height={106} className={img} />
          <img src={heroLight} alt="gather" width={337} height={106} className={`${img} dark:hidden`} />
          <img src={heroDark} alt="gather" width={337} height={106} className={`${img} hidden dark:block`} />
        </span>
      </h1>
      <p className="mt-1 text-[20px] font-bold text-bokara/70 xl:ml-[55px] xl:mt-[10px] xl:text-[30px] dark:text-whisper/70">
        go together, plan together
      </p>
    </div>
  )
}

export default function Signup() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const lastChecked = useRef<string>('')

  const setFieldError = (field: Field, message?: string) => setErrors((e) => ({ ...e, [field]: message }))

  /** On leaving the Username field: format check, then (quietly) availability. */
  async function onUsernameBlur() {
    const name = normalizeUsername(username)
    if (!name) return
    const formatError = validateUsername(name)
    if (formatError) return setFieldError('username', formatError)
    if (!isSupabaseConfigured || lastChecked.current === name) return
    lastChecked.current = name
    try {
      const free = await isUsernameAvailable(name)
      // Ignore stale answers if the user kept typing.
      if (normalizeUsername(username) === name) setFieldError('username', free ? undefined : MSG.usernameTaken)
    } catch {
      // Network trouble here is not worth an error; submit checks again.
      lastChecked.current = ''
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    setFormError(null)

    const name = normalizeUsername(username)
    const next: FieldErrors = {
      username: validateUsername(name),
      email: validateEmail(email),
      password: validateNewPassword(password),
      confirm: validatePasswordConfirm(password, confirm),
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    if (!isSupabaseConfigured) {
      setFormError(MSG.notConfigured)
      return
    }

    setLoading(true)
    try {
      if (!(await isUsernameAvailable(name))) {
        setFieldError('username', MSG.usernameTaken)
        return
      }

      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { username: name },
            // Confirmation link opens the app; same browser → signed in automatically.
            emailRedirectTo: `${window.location.origin}/login`,
          },
        }),
      )

      if (error) {
        // A sign-up that fails in the database is almost always a username
        // taken in the moment between our check and the sign-up.
        if (error.code === 'unexpected_failure' && !(await isUsernameAvailable(name).catch(() => true))) {
          setFieldError('username', MSG.usernameTaken)
          return
        }
        const result = signupErrorMessage(error)
        if (result.field) setFieldError(result.field, result.message)
        else setFormError(result.message)
        return
      }

      // With "Confirm email" on, Supabase hides whether an email is registered:
      // an existing address comes back as a user with no identities.
      if (data.user && data.user.identities?.length === 0) {
        setFieldError('email', MSG.emailTaken)
        return
      }

      if (data.session) {
        // "Confirm email" is off in Supabase: the user is signed in already.
        navigate('/welcome', { replace: true })
        return
      }
      setSentTo(email.trim())
    } catch (err) {
      setFormError(signupErrorMessage(err).message)
    } finally {
      // Always reset, on success and failure (brief: never hang on "…ing").
      setLoading(false)
    }
  }

  return (
    <AuthLayout swirl="signup">
      {/*
        One form, two layouts:
        - xl (≥1280px): Figma layout. Hero + scattered feature cards left, card right.
        - below: heading, card, then the feature cards stacked.
      */}
      <div className="flex w-full max-w-[470px] flex-col items-center gap-8 xl:w-[1250px] xl:max-w-none xl:flex-row xl:gap-0 xl:pr-[50px]">
        <div className="xl:relative xl:h-[717px] xl:w-[730px] xl:shrink-0">
          <Hero />
          <div className="hidden xl:block">
            <FeatureCards layout="scattered" />
          </div>
        </div>

        <AuthCard className="shrink-0">
          {sentTo ? (
            <div className="py-6 text-center" role="status">
              <h2 className="text-[40px] font-bold leading-[normal] text-bokara dark:text-whisper">Check your inbox</h2>
              <p className="mt-4 text-[15px] font-bold text-bokara/70 dark:text-whisper/70">
                We sent a confirmation link to <span className="break-all text-bokara dark:text-whisper">{sentTo}</span>. Open
                it, then log in.
              </p>
              <Link
                to="/login"
                className="mt-8 inline-block text-[15px] font-bold text-lime underline underline-offset-2 hover:text-hunter dark:hover:text-sage"
              >
                Back to log-in
              </Link>
            </div>
          ) : (
            <>
              <div className="pl-[5px]">
                <h2 className="text-[40px] font-bold leading-[normal] text-bokara dark:text-whisper">Get started</h2>
                <p className="mt-[10px] text-[15px] font-bold text-bokara/70 dark:text-whisper/70">
                  Welcome to gather! Let’s create an account
                </p>
              </div>

              <form noValidate onSubmit={onSubmit} className="mt-[29px]">
                <TextField
                  label="Username"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={20}
                  placeholder="username"
                  icon={{ light: userLight, dark: userDark }}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))
                    if (errors.username) setFieldError('username', undefined)
                  }}
                  onBlur={onUsernameBlur}
                  error={errors.username}
                  disabled={loading}
                />
                <TextField
                  className="mt-5"
                  label="Email address"
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="example@email.com"
                  icon={{ light: emailLight, dark: emailDark }}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setFieldError('email', undefined)
                  }}
                  error={errors.email}
                  disabled={loading}
                />
                <PasswordField
                  className="mt-5"
                  label="Password"
                  name="new-password"
                  autoComplete="new-password"
                  placeholder="password"
                  hint={MSG.passwordHint}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setFieldError('password', undefined)
                  }}
                  error={errors.password}
                  disabled={loading}
                />
                <PasswordField
                  className="mt-5"
                  label="Confirm password"
                  name="confirm-password"
                  autoComplete="new-password"
                  placeholder="password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value)
                    if (errors.confirm) setFieldError('confirm', undefined)
                  }}
                  error={errors.confirm}
                  disabled={loading}
                />

                {formError && (
                  <div className="mt-5">
                    <FormError message={formError} />
                  </div>
                )}

                <PrimaryButton type="submit" className="mt-5" loading={loading} loadingText="Creating account…">
                  Sign-up
                </PrimaryButton>
              </form>

              <div className="mt-5">
                <OrDivider />
              </div>
              <div className="mt-5">
                <GoogleButton />
              </div>

              <p className="mt-5 text-center text-[15px] font-bold text-bokara/70 dark:text-whisper/70">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-lime underline decoration-[10%] underline-offset-2 hover:text-hunter focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-lime dark:hover:text-sage"
                >
                  Log-in
                </Link>
              </p>
            </>
          )}
        </AuthCard>

        <div className="w-full xl:hidden">
          <FeatureCards layout="stacked" />
        </div>
      </div>
    </AuthLayout>
  )
}
