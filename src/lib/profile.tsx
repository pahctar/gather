/* eslint-disable react-refresh/only-export-components -- provider + its hooks/helpers live together */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { PostgrestError } from '@supabase/supabase-js'
import { useAuth } from './auth'
import { supabase } from './supabase'
import { withTimeout, TimeoutError } from './timeout'
import { MSG } from './messages'

export type Profile = {
  id: string
  username: string
  display_name: string | null
  date_of_birth: string | null
  avatar_url: string | null
}

const COLUMNS = 'id, username, display_name, date_of_birth, avatar_url'

/** A profile is complete once it has a name (Create profile done). */
export function isProfileComplete(p: Profile | null): boolean {
  return Boolean(p?.display_name?.trim())
}

export function profileErrorMessage(err: unknown): string {
  if (err instanceof TimeoutError) return MSG.timeout
  const pg = err as Partial<PostgrestError> | null
  // 42P01: table missing; PGRST205: table not in the API schema cache.
  if (pg?.code === '42P01' || pg?.code === 'PGRST205') return MSG.profileMissingTable
  if (err instanceof TypeError) return MSG.network
  return MSG.profileLoad
}

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await withTimeout(
    supabase.from('profiles').select(COLUMNS).eq('id', userId).single<Profile>(),
  )
  if (error) throw error
  return data
}

export type ProfileUpdate = Partial<Pick<Profile, 'display_name' | 'date_of_birth' | 'avatar_url'>>

export async function updateProfile(userId: string, changes: ProfileUpdate): Promise<Profile> {
  const { data, error } = await withTimeout(
    supabase.from('profiles').update(changes).eq('id', userId).select(COLUMNS).single<Profile>(),
  )
  if (error) throw error
  return data
}

type ProfileState = {
  loading: boolean
  error: string | null
  profile: Profile | null
  reload: () => void
  setProfile: (p: Profile) => void
}

const ProfileContext = createContext<ProfileState | null>(null)

/** Loads the signed-in user's profile row. Mounted only inside RequireAuth. */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!userId) return
    let active = true
    setLoading(true)
    setError(null)
    fetchProfile(userId)
      .then((p) => {
        if (active) setProfile(p)
      })
      .catch((err) => {
        if (active) setError(profileErrorMessage(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId, attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  return (
    <ProfileContext.Provider value={{ loading, error, profile, reload, setProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile(): ProfileState {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>')
  return ctx
}
