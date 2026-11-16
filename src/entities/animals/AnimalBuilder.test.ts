import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { createAnimal, createHerd } from './AnimalBuilder'

describe('createAnimal', () => {
  it.each(['cow', 'sheep', 'goat', 'chicken'] as const)('builds a %s with a head pivot', (species) => {
    const animal = createAnimal({ species })
    expect(animal.getObjectByName('animal-neck')).toBeTruthy()
    expect(animal.getObjectByName('animal-head')).toBeTruthy()
    expect(animal.children.length).toBeGreaterThan(3)
  })

  it('scales uniformly', () => {
    const animal = createAnimal({ species: 'cow', scale: 2 })
    expect(animal.scale.x).toBe(2)
    expect(animal.scale.y).toBe(2)
    expect(animal.scale.z).toBe(2)
  })
})

describe('createHerd', () => {
  it('creates exactly count animals inside the grazing area', () => {
    const herd = createHerd({ species: 'cow', count: 9, area: { width: 8, depth: 6 }, center: [3, 0, 4] })
    const animals = herd.children.filter((c) => c.name === 'animal-cow')
    expect(animals).toHaveLength(9)

    // local positions are inside the area box, world positions shifted by center
    for (const a of animals) {
      expect(Math.abs(a.position.x)).toBeLessThanOrEqual(8 / 2)
      expect(Math.abs(a.position.z)).toBeLessThanOrEqual(6 / 2)
    }
    expect(herd.position.x).toBe(3)
    expect(herd.position.z).toBe(4)
  })

  it('is deterministic for the same seed', () => {
    const a = createHerd({ species: 'sheep', count: 5, seed: 9 })
    const b = createHerd({ species: 'sheep', count: 5, seed: 9 })
    const c = createHerd({ species: 'sheep', count: 5, seed: 10 })
    for (let i = 0; i < a.children.length; i++) {
      const pa = a.children[i]
      const pb = b.children[i]
      if (!pa || !pb) throw new Error(`missing animal ${i}`)
      expect(pb.position.x).toBeCloseTo(pa.position.x)
      expect(pb.position.z).toBeCloseTo(pa.position.z)
    }
    const ca = a.children[0]
    const cc = c.children[0]
    if (!ca || !cc) throw new Error('missing first animal')
    expect(cc.position.x).not.toBeCloseTo(ca.position.x)
  })

  it('registers the grazing animation when a tick registry is given', () => {
    const registered: Array<(d: number, e: number) => void> = []
    const herd = createHerd({
      species: 'cow',
      count: 3,
      registerTick: (fn) => {
        registered.push(fn)
        return () => {}
      },
    })
    expect(registered).toHaveLength(1)

    // Stepping the tick runs the graze cycle on every neck without throwing
    const first = herd.children[0]
    expect(first).toBeTruthy()
    const neck = first!.getObjectByName('animal-neck') as THREE.Group
    const tick = registered[0]
    expect(tick).toBeTypeOf('function')
    tick!(0.016, 10)
    expect(typeof neck.rotation.x).toBe('number')
  })

  it('tags every animal with the entityId for raycast selection', () => {
    const herd = createHerd({ species: 'chicken', count: 4, entityId: 'zone-poultry' })
    expect(herd.userData.entityId).toBe('zone-poultry')
    for (const child of herd.children) {
      expect(child.userData.entityId).toBe('zone-poultry')
    }
  })
})
