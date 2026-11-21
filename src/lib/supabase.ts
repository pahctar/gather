import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { fetchWithTimeout } from './timeout'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when .env.local has both Supabase values. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Single shared client. Sessions persist in localStorage (works in Safari,
 * including private mode on Safari 11+). Every request goes through
 * fetchWithTimeout so nothing can hang forever.
 */
export const supabase: SupabaseClient = createClient(
  url ?? 'http://localhost:54321',
  anonKey ?? 'missing-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: { fetch: (input, init) => fetchWithTimeout(input, init) },
  },
)
