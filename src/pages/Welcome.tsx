import { useState } from 'react'
import { AuthCard, AuthLayout } from '../components/auth/AuthLayout'
import { PrimaryButton } from '../components/auth/Buttons'
import { useAuth } from '../lib/auth'
import { useProfile } from '../lib/profile'
import logo from '../assets/raster/logo@3x.png'

/** Placeholder landing page after log-in (Home design is unfinished). */
export default function Welcome() {
  const { signOut } = useAuth()
  const { profile } = useProfile()
  const [signingOut, setSigningOut] = useState(false)

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
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" width={90} height={90} className="mx-auto size-[90px] rounded-full object-cover" />
        ) : (
          <img src={logo} alt="" aria-hidden width={90} height={69} className="mx-auto" />
        )}
        <h1 className="mt-6 break-words text-[32px] font-bold leading-tight text-bokara dark:text-whisper">
          Welcome, {profile?.display_name}
        </h1>
        <PrimaryButton type="button" className="mt-8" onClick={onSignOut} loading={signingOut} loadingText="Logging out…">
          Log out
        </PrimaryButton>
      </AuthCard>
    </AuthLayout>
  )
}
