import { describe, expect, it } from 'vitest'
import { dobToParts, parseDob } from './dob'
import { MSG } from './messages'

const TODAY = new Date(2026, 10, 21) // 21 Nov 2026

const p = (day: string, month: string, year: string) => parseDob({ day, month, year }, TODAY)

describe('date of birth (optional)', () => {
  it('blank is fine and saves as null', () => {
    expect(p('', '', '')).toEqual({ ok: true, value: null })
    expect(p(' ', '', ' ')).toEqual({ ok: true, value: null })
  })

  it('parses DD / MM / YYYY into an ISO date', () => {
    expect(p('20', '02', '2000')).toEqual({ ok: true, value: '2000-02-20' })
    expect(p('1', '2', '1999')).toEqual({ ok: true, value: '1999-02-01' })
    expect(p('29', '02', '2000')).toEqual({ ok: true, value: '2000-02-29' }) // leap year
    expect(p('21', '11', '2026')).toEqual({ ok: true, value: '2026-11-21' }) // today
  })

  it.each([
    ['31', '', ''],
    ['', '02', '2000'],
    ['20', '02', ''],
    ['20', '02', '200'],
  ])('partly filled %j/%j/%j → "full date or blank"', (d, m, y) => {
    expect(p(d, m, y)).toEqual({ ok: false, error: MSG.dobIncomplete })
  })

  it.each([
    ['31', '02', '2000'], // no 31 Feb
    ['29', '02', '2001'], // not a leap year
    ['00', '01', '2000'],
    ['10', '13', '2000'],
    ['22', '11', '2026'], // tomorrow
    ['01', '01', '1899'], // before 1900 (database limit)
  ])('impossible or out-of-range %j/%j/%j → "real date"', (d, m, y) => {
    expect(p(d, m, y)).toEqual({ ok: false, error: MSG.dobInvalid })
  })

  it('splits a saved date back into boxes', () => {
    expect(dobToParts('2000-02-20')).toEqual({ day: '20', month: '02', year: '2000' })
    expect(dobToParts(null)).toEqual({ day: '', month: '', year: '' })
  })
})
