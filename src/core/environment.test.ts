import { describe, it, expect } from 'vitest'
import { createEnvironment, validateEnvironment } from './environment'
import { officePreset, farmPreset, factoryPreset, schoolPreset, hospitalPreset } from '../presets'

describe('Environment Factory & Presets', () => {
  it('creates an environment using officePreset', () => {
    const world = createEnvironment({
      preset: officePreset,
      name: 'Nexora Agency HQ',
    })

    expect(world.name).toBe('Nexora Agency HQ')
    expect(world.type).toBe('office')
    expect(world.dimensions.width).toBe(36)
    expect(world.zones.length).toBe(6)
    expect(world.entities.length).toBe(17)
  })

  it('creates an environment using farmPreset', () => {
    const world = createEnvironment({
      preset: farmPreset,
      name: 'Organic Farm Valley',
    })

    expect(world.type).toBe('farm')
    expect(world.zones.length).toBe(3)
    expect(world.entities.length).toBe(3)
  })

  it('creates an environment using factoryPreset', () => {
    const world = createEnvironment({
      preset: factoryPreset,
      name: 'Auto Plant 4',
    })

    expect(world.type).toBe('factory')
    expect(world.entities.length).toBe(3)
  })

  it('validates environment entity ids and positions', () => {
    expect(() => {
      validateEnvironment({
        id: '',
        type: 'test',
        name: 'Invalid World',
        dimensions: { width: 10, height: 10, depth: 10 },
        camera: { position: [0, 0, 0], target: [0, 0, 0] },
        lighting: {},
        theme: { name: 'test' },
        zones: [],
        entities: [],
      })
    }).toThrow('WorldDefinition must have a valid id')
  })
})
