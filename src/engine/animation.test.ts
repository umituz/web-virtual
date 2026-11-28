import { describe, it, expect } from 'vitest'
import { createPhotoperiod, smoothstep, damp } from './animation'

describe('smoothstep', () => {
  it('clamps outside the edges', () => {
    expect(smoothstep(0, 1, -1)).toBe(0)
    expect(smoothstep(0, 1, 2)).toBe(1)
  })

  it('passes through the midpoint at half strength', () => {
    const mid = smoothstep(0, 1, 0.5)
    expect(mid).toBeGreaterThan(0.4)
    expect(mid).toBeLessThan(0.6)
  })
})

describe('damp', () => {
  it('moves toward the target without overshooting', () => {
    const next = damp(0, 10, 4, 0.016)
    expect(next).toBeGreaterThan(0)
    expect(next).toBeLessThan(10)
  })
})

describe('createPhotoperiod', () => {
  it('is fully on inside the on-window and fully off after it', () => {
    const phase = createPhotoperiod({ periodSeconds: 20, onFraction: 0.6, fadeFraction: 0.05 })
    expect(phase(10)).toBeCloseTo(1, 5)
    expect(phase(17)).toBe(0)
    expect(phase(30)).toBeCloseTo(1, 5)
  })

  it('carries its resolved configuration', () => {
    const phase = createPhotoperiod({ periodSeconds: 12, onFraction: 0.8, fadeFraction: 0.1 })
    expect(phase.periodSeconds).toBe(12)
    expect(phase.onFraction).toBe(0.8)
    expect(phase.fadeFraction).toBe(0.1)
  })

  it('fades monotonically through the off transition', () => {
    const phase = createPhotoperiod({ periodSeconds: 10, onFraction: 0.7, fadeFraction: 0.2 })
    let last = 1
    for (let t = 6; t <= 7.001; t += 0.05) {
      const level = phase(t)
      expect(level).toBeLessThanOrEqual(last + 1e-9)
      last = level
    }
    expect(last).toBe(0)
  })
})
