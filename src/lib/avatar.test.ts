import { describe, expect, it } from 'vitest'
import { avatarPath, avatarPathFromUrl, isAcceptableAvatar } from './avatar'

const file = (type: string, bytes: number) => new File([new Uint8Array(bytes)], 'x', { type })

describe('avatar files', () => {
  it('accepts JPG, PNG and WebP up to 5 MB', () => {
    expect(isAcceptableAvatar(file('image/jpeg', 1000))).toBe(true)
    expect(isAcceptableAvatar(file('image/png', 5 * 1024 * 1024))).toBe(true)
    expect(isAcceptableAvatar(file('image/webp', 1000))).toBe(true)
  })

  it('rejects other types, empty files and anything over 5 MB', () => {
    expect(isAcceptableAvatar(file('image/gif', 1000))).toBe(false)
    expect(isAcceptableAvatar(file('image/heic', 1000))).toBe(false)
    expect(isAcceptableAvatar(file('image/jpeg', 0))).toBe(false)
    expect(isAcceptableAvatar(file('image/jpeg', 5 * 1024 * 1024 + 1))).toBe(false)
  })

  it('stores files in the user’s own folder with a fresh name', () => {
    expect(avatarPath('abc', 123)).toBe('abc/avatar-123.jpg')
  })

  it('finds the storage path of our own avatar URLs only', () => {
    expect(avatarPathFromUrl('https://x.supabase.co/storage/v1/object/public/avatars/abc/avatar-1.jpg')).toBe('abc/avatar-1.jpg')
    expect(avatarPathFromUrl('https://example.com/me.jpg')).toBeNull()
    expect(avatarPathFromUrl(null)).toBeNull()
  })
})
