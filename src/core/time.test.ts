import { describe, expect, it } from 'vitest'
import { isNightHour } from './time'

const at = (hour: number): Date => new Date(2026, 10, 16, hour, 30)

describe('isNightHour', () => {
  it('covers the default 19→07 window across midnight', () => {
    expect(isNightHour(19, 7, at(19))).toBe(true)
    expect(isNightHour(19, 7, at(23))).toBe(true)
    expect(isNightHour(19, 7, at(3))).toBe(true)
    expect(isNightHour(19, 7, at(6))).toBe(true)
    expect(isNightHour(19, 7, at(7))).toBe(false)
    expect(isNightHour(19, 7, at(12))).toBe(false)
    expect(isNightHour(19, 7, at(18))).toBe(false)
  })

  it('handles same-day windows without wrapping', () => {
    expect(isNightHour(9, 17, at(12))).toBe(true)
    expect(isNightHour(9, 17, at(8))).toBe(false)
    expect(isNightHour(9, 17, at(17))).toBe(false)
  })
})
