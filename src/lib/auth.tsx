import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabase'
import { withTimeout } from './timeout'

type AuthState = {
  /** True until the stored session has been read on startup. */
  initializing: boolean
  session: Session | null
  user: User | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let active = true

    if (!isSupabaseConfigured) {
      setInitializing(false)
      return
    }

    // Read the stored session (localStorage). Time-boxed so a slow token
    // refresh can never leave the app on a blank loading screen.
    withTimeout(supabase.auth.getSession())
      .then(({ data }) => {
        if (active) setSession(data.session)
      })
      .catch(() => {
        if (active) setSession(null)
      })
      .finally(() => {
        if (active) setInitializing(false)
      })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) setSession(next)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      initializing,
      session,
      user: session?.user ?? null,
      signOut: async () => {
        try {
          await withTimeout(supabase.auth.signOut())
        } catch {
          // Server unreachable: still clear the session on this device.
          await supabase.auth.signOut({ scope: 'local' })
        }
      },
    }),
    [initializing, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
