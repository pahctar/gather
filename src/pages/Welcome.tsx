import { useState } from 'react'
import { AuthCard, AuthLayout } from '../components/auth/AuthLayout'
import { PrimaryButton } from '../components/auth/Buttons'
import { useAuth } from '../lib/auth'
import logo from '../assets/raster/logo@3x.png'

/**
 * Placeholder landing page after log-in (Home design is unfinished).
 * Name source: profile display name from step 4; until then the username
 * saved at sign-up, falling back to the email.
 */
export default function Welcome() {
  const { user, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  const name =
    (user?.user_metadata?.display_name as string | undefined) ??
    (user?.user_metadata?.username as string | undefined) ??
    user?.email ??
    'there'

  async function onSignOut() {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <AuthLayout swirl="login">
      <AuthCard className="text-center">
        <img src={logo} alt="" aria-hidden width={90} height={69} className="mx-auto" />
        <h1 className="mt-6 break-words text-[32px] font-bold leading-tight text-bokara dark:text-whisper">
          Welcome, {name}
        </h1>
        <PrimaryButton type="button" className="mt-8" onClick={onSignOut} loading={signingOut} loadingText="Logging out…">
          Log out
        </PrimaryButton>
      </AuthCard>
    </AuthLayout>
  )
}
