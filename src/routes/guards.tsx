import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { isProfileComplete, useProfile } from '../lib/profile'
import { MSG } from '../lib/messages'
import { AuthCard, AuthLayout } from '../components/auth/AuthLayout'
import { PrimaryButton } from '../components/auth/Buttons'

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bright dark:bg-bokara" role="status">
      <span className="sr-only">Loading…</span>
      <span aria-hidden className="h-8 w-8 animate-spin rounded-full border-[3px] border-lime/30 border-t-lime" />
    </div>
  )
}

/** Everyone must sign in: no session → /login (remembering where they were going). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { initializing, session } = useAuth()
  const location = useLocation()
  if (initializing) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}

/** Log-in / Sign-up: already signed in → go to the app. */
export function PublicOnly({ children }: { children: ReactNode }) {
  const { initializing, session } = useAuth()
  if (initializing) return <FullPageSpinner />
  if (session) return <Navigate to="/welcome" replace />
  return <>{children}</>
}

/** Shown when the profile can't be loaded (timeout, offline, missing table). */
function ProfileLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { signOut } = useAuth()
  return (
    <AuthLayout swirl="profile">
      <AuthCard className="text-center">
        <p role="alert" className="text-[17px] font-bold text-bokara dark:text-whisper">
          {message}
        </p>
        <PrimaryButton type="button" className="mt-6" onClick={onRetry}>
          {MSG.tryAgain}
        </PrimaryButton>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-4 text-[15px] font-bold text-lime underline underline-offset-2"
        >
          Log out
        </button>
      </AuthCard>
    </AuthLayout>
  )
}

/**
 * Pages of the app proper: the user must have finished Create profile.
 * `mode="incomplete"` is the opposite, for the Create profile page itself.
 */
export function RequireProfile({ children, mode = 'complete' }: { children: ReactNode; mode?: 'complete' | 'incomplete' }) {
  const { loading, error, profile, reload } = useProfile()
  if (loading) return <FullPageSpinner />
  if (error || !profile) return <ProfileLoadError message={error ?? MSG.profileLoad} onRetry={reload} />
  const complete = isProfileComplete(profile)
  if (mode === 'complete' && !complete) return <Navigate to="/create-profile" replace />
  if (mode === 'incomplete' && complete) return <Navigate to="/welcome" replace />
  return <>{children}</>
}
