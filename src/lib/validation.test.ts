import { describe, expect, it } from 'vitest'
import { MSG } from './messages'
import {
  normalizeUsername,
  validateEmail,
  validateNewPassword,
  validatePasswordConfirm,
  validateUsername,
} from './validation'

describe('password rules (brief: minimum 8 characters only)', () => {
  it.each([
    ['abcdefgh', undefined],
    ['        ', undefined], // spaces count; no other requirements
    ['12345678', undefined],
    ['ééééééé', MSG.passwordShort], // 7 characters
    ['🙂🙂🙂🙂🙂🙂🙂🙂', undefined], // 8 characters (16 UTF-16 units)
    ['abcdefg', MSG.passwordShort],
    ['', MSG.passwordShort],
  ])('%j → %s', (pw, expected) => {
    expect(validateNewPassword(pw)).toBe(expected)
  })

  it('confirm must match exactly', () => {
    expect(validatePasswordConfirm('password1', 'password1')).toBeUndefined()
    expect(validatePasswordConfirm('password1', 'Password1')).toBe(MSG.passwordMismatch)
  })
})

describe('usernames', () => {
  it.each(['abc', 'mild_01', 'a_b_c_d_e_f_g_h_i_j_'])('accepts %j', (u) => {
    expect(validateUsername(u)).toBeUndefined()
  })
  it.each(['ab', 'a'.repeat(21), 'mild-01', 'mild 01', 'Mild', 'มายด์'])('rejects %j', (u) => {
    expect(validateUsername(u)).toBe(MSG.usernameFormat)
  })
  it('normalises case and surrounding spaces', () => {
    expect(normalizeUsername('  Mild_01 ')).toBe('mild_01')
  })
})

describe('email', () => {
  it('accepts normal addresses and trims spaces', () => {
    expect(validateEmail(' mild@example.com ')).toBeUndefined()
  })
  it.each(['', 'mild', 'mild@', 'mild@example', 'mi ld@example.com'])('rejects %j', (e) => {
    expect(validateEmail(e)).toBe(MSG.emailInvalid)
  })
})
