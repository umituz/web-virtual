import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import type { WorldTickFn, UnregisterTick } from '../core/types'
import { verticalLabPreset, VERTICAL_LAB_SLOTS } from './verticalLabPreset'

describe('verticalLabPreset', () => {
  it('ships architecture and slots but never occupants', () => {
    expect(verticalLabPreset.slots?.length).toBeGreaterThan(0)
    expect(verticalLabPreset.defaultEntities ?? []).toHaveLength(0)
    expect(VERTICAL_LAB_SLOTS.length).toBe(6)
  })

  it('opts into bloom and turns the office spots off', () => {
    expect(verticalLabPreset.effects?.bloom).toBeTruthy()
    expect(verticalLabPreset.lighting.interiorSpots).toBe(false)
  })

  it('builds a populated scene through its builders', () => {
    const fns: WorldTickFn[] = []
    const registerTick = (fn: WorldTickFn): UnregisterTick => {
      fns.push(fn)
      return () => {}
    }
    const scene = new THREE.Scene()
    verticalLabPreset.buildScene?.(scene, { registerTick })
    expect(scene.children.length).toBeGreaterThan(10)
    expect(fns.length).toBeGreaterThan(10)
    let instancedCount = 0
    scene.traverse((obj) => {
      if ((obj as THREE.InstancedMesh).isInstancedMesh) instancedCount += 1
    })
    expect(instancedCount).toBeGreaterThanOrEqual(6)
  })

  it('keeps every zone focus inside the room bounds', () => {
    const { width, depth } = verticalLabPreset.dimensions
    for (const zone of verticalLabPreset.zones) {
      const [x, , z] = zone.cameraFocus ?? [0, 0, 0]
      expect(Math.abs(x)).toBeLessThanOrEqual(width / 2 + 1)
      expect(Math.abs(z)).toBeLessThanOrEqual(depth / 2 + 1)
    }
  })
})
