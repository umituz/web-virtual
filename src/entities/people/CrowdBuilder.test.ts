import { describe, it, expect, vi } from 'vitest'
import { createCrowd } from './CrowdBuilder'

vi.mock('../../engine/modelLoader', () => ({
  ModelLoader: {
    getInstance: () => ({
      load: async () => null,
    }),
  },
}))

describe('createCrowd', () => {
  it('instantiates crowd group with expected name and registers tick callback', () => {
    let tickRegistered = false
    const crowd = createCrowd({
      count: 10,
      centerX: 2,
      centerZ: 3,
      radius: 2,
      registerTick: (fn) => {
        tickRegistered = true
        expect(typeof fn).toBe('function')
      },
    })

    expect(crowd.name).toBe('virtual-crowd')
    expect(tickRegistered).toBe(true)
  })
})
