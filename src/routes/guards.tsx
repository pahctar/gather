import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

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
