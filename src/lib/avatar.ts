import { supabase } from './supabase'
import { withTimeout } from './timeout'

export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024
/** Uploaded avatars are square JPEGs this many pixels wide (crisp at 140px on 3x screens). */
export const AVATAR_SIZE = 512

/** Same limits as the storage bucket: JPG/PNG/WebP, up to 5 MB. */
export function isAcceptableAvatar(file: File): boolean {
  return (AVATAR_TYPES as readonly string[]).includes(file.type) && file.size > 0 && file.size <= AVATAR_MAX_BYTES
}

/**
 * Centre-crops to a square and scales to 512×512 JPEG. Keeps uploads small and
 * strips photo metadata (EXIF, location). Browsers apply EXIF rotation when
 * drawing an <img>, so phone photos come out the right way up.
 */
export async function toSquareJpeg(file: File, size = AVATAR_SIZE): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const side = Math.min(img.naturalWidth, img.naturalHeight)
    const sx = (img.naturalWidth - side) / 2
    const sy = (img.naturalHeight - side) / 2
    const out = Math.min(size, side)
    const canvas = document.createElement('canvas')
    canvas.width = out
    canvas.height = out
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not available')
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = '#F6F2F1' // transparent PNGs get the card colour, not black
    ctx.fillRect(0, 0, out, out)
    ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode image'))), 'image/jpeg', 0.9),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Object path inside the bucket: "<user id>/avatar-<time>.jpg" (new name each time, so caches never show an old photo). */
export function avatarPath(userId: string, now = Date.now()): string {
  return `${userId}/avatar-${now}.jpg`
}

/** Uploads the processed avatar and returns its public URL and path. Throws on failure. */
export async function uploadAvatar(userId: string, file: File): Promise<{ url: string; path: string }> {
  const blob = await toSquareJpeg(file)
  const path = avatarPath(userId)
  const { error } = await withTimeout(
    supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: false, cacheControl: '31536000' }),
  )
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return { url: data.publicUrl, path }
}

/** Best effort: removes an uploaded file (e.g. when saving the profile fails afterwards). */
export async function removeAvatar(path: string): Promise<void> {
  try {
    await withTimeout(supabase.storage.from('avatars').remove([path]))
  } catch {
    // Leaving an unused file behind is harmless.
  }
}

/** "…/storage/v1/object/public/avatars/<path>" → "<path>", for files in our bucket only. */
export function avatarPathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const marker = '/storage/v1/object/public/avatars/'
  const i = url.indexOf(marker)
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length))
}
