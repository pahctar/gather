import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, type Location } from 'react-router-dom'
import { AuthCard, AuthLayout } from '../components/auth/AuthLayout'
import { FormError, GoogleButton, OrDivider, PrimaryButton } from '../components/auth/Buttons'
import { PasswordField, TextField } from '../components/auth/Fields'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { withTimeout } from '../lib/timeout'
import { loginErrorMessage } from '../lib/authErrors'
import { MSG } from '../lib/messages'
import { validateEmail, validateLoginPassword } from '../lib/validation'
import logo from '../assets/raster/logo@3x.png'
import wordLight from '../assets/raster/wordmark-gather-light@3x.png'
import wordDark from '../assets/raster/wordmark-gather-dark@3x.png'
import emailLight from '../assets/figma/icon-email-light.svg'
import emailDark from '../assets/figma/icon-email-dark.svg'

type FieldErrors = { email?: string; password?: string }

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/welcome'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    setFormError(null)

    const errors: FieldErrors = {
      email: validateEmail(email),
      password: validateLoginPassword(password),
    }
    setFieldErrors(errors)
    if (errors.email || errors.password) return

    if (!isSupabaseConfigured) {
      setFormError(MSG.notConfigured)
      return
    }

    setLoading(true)
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email: email.trim(), password }),
      )
      if (error) {
        setFormError(loginErrorMessage(error))
        return
      }
      navigate(from, { replace: true })
    } catch (err) {
      setFormError(loginErrorMessage(err))
    } finally {
      // Always reset, on success and failure (brief: never hang on "…ing").
      setLoading(false)
    }
  }

  return (
    <AuthLayout swirl="login">
      <AuthCard>
        <img src={logo} alt="" aria-hidden width={90} height={69} className="mx-auto" />

        <h1 className="mt-[22px] flex items-start justify-center gap-4 text-[40px] font-bold leading-[45px] text-bokara dark:text-whisper">
          <span>Let’s</span>
          <img src={wordLight} alt="gather" width={130} height={41} className="mt-1 dark:hidden" />
          <img src={wordDark} alt="gather" width={130} height={41} className="mt-1 hidden dark:block" />
        </h1>
        <p className="mt-2 text-center text-[15px] font-bold text-bokara/70 dark:text-whisper/70">
          Log-in to pick up where you left off
        </p>

        <form noValidate onSubmit={onSubmit} className="mt-10">
          <TextField
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
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            disabled={loading}
          />
          <PasswordField
            className="mt-5"
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            disabled={loading}
          />

          {formError && (
            <div className="mt-5">
              <FormError message={formError} />
            </div>
          )}

          <PrimaryButton type="submit" className="mt-[38px]" loading={loading} loadingText="Logging in…">
            Log-in
          </PrimaryButton>
        </form>

        <div className="mt-5">
          <OrDivider />
        </div>
        <div className="mt-5">
          <GoogleButton />
        </div>

        <p className="mt-[31px] text-center text-[15px] font-bold text-bokara/70 dark:text-whisper/70">
          New to gather?{' '}
          <Link
            to="/signup"
            className="text-lime underline decoration-[10%] underline-offset-2 hover:text-hunter focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-lime dark:hover:text-sage"
          >
            Create an account
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}
