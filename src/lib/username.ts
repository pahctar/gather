import { supabase } from './supabase'
import { withTimeout } from './timeout'

/**
 * Asks the database whether a username is free (public.username_available).
 * Callable before sign-in. Throws on network errors/timeouts.
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await withTimeout(supabase.rpc('username_available', { name: username }))
  if (error) throw error
  return data === true
}
