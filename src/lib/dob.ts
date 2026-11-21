import { MSG } from './messages'

export type DobParts = { day: string; month: string; year: string }

export type DobResult =
  | { ok: true; value: string | null } // ISO yyyy-mm-dd, or null when left blank
  | { ok: false; error: string }

/** Earliest date the database accepts (constraint date_of_birth_range). */
const MIN_YEAR = 1900

/**
 * Date of birth is optional: all three boxes empty → null.
 * Some boxes filled → "Enter a full date of birth, or leave it blank."
 * Impossible (31/02), in the future, or before 1900 → "Enter a real date of birth."
 */
export function parseDob({ day, month, year }: DobParts, today = new Date()): DobResult {
  const d = day.trim()
  const m = month.trim()
  const y = year.trim()

  if (!d && !m && !y) return { ok: true, value: null }
  if (!d || !m || !y || y.length !== 4) return { ok: false, error: MSG.dobIncomplete }
  if (!/^\d{1,2}$/.test(d) || !/^\d{1,2}$/.test(m) || !/^\d{4}$/.test(y)) return { ok: false, error: MSG.dobInvalid }

  const dd = Number(d)
  const mm = Number(m)
  const yyyy = Number(y)
  // Build in UTC so time zones can't shift the day.
  const date = new Date(Date.UTC(yyyy, mm - 1, dd))
  const real = date.getUTCFullYear() === yyyy && date.getUTCMonth() === mm - 1 && date.getUTCDate() === dd
  if (!real || yyyy < MIN_YEAR) return { ok: false, error: MSG.dobInvalid }

  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  if (date.getTime() > todayUtc) return { ok: false, error: MSG.dobInvalid }

  const iso = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
  return { ok: true, value: iso }
}

/** ISO yyyy-mm-dd → boxes (for pre-filling). */
export function dobToParts(iso: string | null | undefined): DobParts {
  if (!iso) return { day: '', month: '', year: '' }
  const [y, m, d] = iso.split('-')
  return { day: d ?? '', month: m ?? '', year: y ?? '' }
}
