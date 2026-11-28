import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import type { WorldTickFn, UnregisterTick } from '../../core/types'
import { createLedBar, LED_SPECTRUM_COLORS } from './LedBarBuilder'
import { createGrowRack } from './GrowRackBuilder'
import { createVerticalTower } from './TowerBuilder'
import { createFishTank } from './FishTankBuilder'
import { createHydroLoop } from './HydroLoopBuilder'
import { createClimateUnit } from './ClimateUnitBuilder'
import { createLabShell } from './LabArchitectureBuilder'
import { createWorkbench } from './WorkbenchBuilder'

function captureTick(): { fns: WorldTickFn[]; registerTick: (fn: WorldTickFn) => UnregisterTick } {
  const fns: WorldTickFn[] = []
  return {
    fns,
    registerTick: (fn: WorldTickFn) => {
      fns.push(fn)
      return () => {}
    },
  }
}

describe('createLedBar', () => {
  it('emits the requested spectrum and pulses with the photoperiod', () => {
    const { fns, registerTick } = captureTick()
    const bar = createLedBar({ spectrum: 'flowering', periodSeconds: 10, registerTick })
    const emissive = (bar.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial
    expect(emissive.emissive.getHexString()).toBe(new THREE.Color(LED_SPECTRUM_COLORS.flowering).getHexString())
    expect(emissive.emissiveIntensity).toBeGreaterThan(1)

    expect(fns.length).toBe(1)
    const step = fns[0]
    expect(step).toBeTruthy()
    step!(0.016, 3)
    expect(emissive.emissiveIntensity).toBeGreaterThan(0)
    step!(0.016, 9)
    expect(emissive.emissiveIntensity).toBe(0)
  })
})

describe('createGrowRack', () => {
  it('builds a tray and an LED bar for every tier', () => {
    const { registerTick } = captureTick()
    const rack = createGrowRack({ tiers: 3, trays: { growth: 0.5 }, led: { periodSeconds: 12 }, registerTick })
    const trays = rack.children.filter(
      (c) => c instanceof THREE.Mesh && (c.material as THREE.MeshStandardMaterial).color.getHexString() === 'e2e8f0',
    )
    const bars = rack.children.filter((c) => c.type === 'Group')
    expect(trays.length).toBe(3)
    expect(bars.length).toBe(3)
  })

  it('skips plants and LEDs when both are disabled', () => {
    const rack = createGrowRack({ tiers: 2, trays: false, led: false })
    expect(rack.children.filter((c) => c instanceof THREE.InstancedMesh)).toHaveLength(0)
    expect(rack.children.filter((c) => c.type === 'Group')).toHaveLength(0)
  })
})

describe('createVerticalTower', () => {
  it('instances one canopy per pocket and optional mist', () => {
    const { registerTick } = captureTick()
    const tower = createVerticalTower({ pocketRows: 5, pocketsPerRow: 4, mist: true, registerTick })
    const instanced = tower.children.filter((c) => c instanceof THREE.InstancedMesh) as THREE.InstancedMesh[]
    expect(instanced.map((m) => m.count)).toEqual([20, 20])
    expect(tower.children.some((c) => (c as THREE.Points).isPoints)).toBe(true)
  })
})

describe('createFishTank', () => {
  it('schools the requested number of fish and animates them', () => {
    const { fns, registerTick } = captureTick()
    const tank = createFishTank({ fishCount: 7, registerTick })
    const fish = tank.children.find((c) => c instanceof THREE.InstancedMesh) as THREE.InstancedMesh
    expect(fish.count).toBe(7)
    expect(fns.length).toBe(1)
    const before = new THREE.Matrix4()
    const after = new THREE.Matrix4()
    fish.getMatrixAt(0, before)
    fns[0]!(0.016, 4.2)
    fish.getMatrixAt(0, after)
    expect(after.equals(before)).toBe(false)
  })
})

describe('createHydroLoop', () => {
  it('flows dashes along the loop over time', () => {
    const { fns, registerTick } = captureTick()
    const loop = createHydroLoop({ points: [[0, 1, 0], [2, 1, 0], [2, 1, 2], [0, 1, 2]], dashCount: 8, registerTick })
    const dashes = loop.children.find((c) => c instanceof THREE.InstancedMesh) as THREE.InstancedMesh
    expect(dashes.count).toBe(8)
    const before = new THREE.Matrix4()
    const after = new THREE.Matrix4()
    dashes.getMatrixAt(0, before)
    fns[0]!(0.016, 1.5)
    dashes.getMatrixAt(0, after)
    expect(after.equals(before)).toBe(false)
  })

  it('refuses degenerate loops', () => {
    expect(() => createHydroLoop({ points: [[0, 0, 0]] })).toThrow()
  })
})

describe('createClimateUnit', () => {
  it('spins its fan on the engine tick', () => {
    const { fns, registerTick } = captureTick()
    const unit = createClimateUnit({ registerTick })
    const fan = unit.children.find((c) => c.type === 'Group' && c.children.length === 4) as THREE.Group
    expect(fan).toBeTruthy()
    const before = fan.rotation.y
    fns[0]!(0.016, 2)
    expect(fan.rotation.y).toBeGreaterThan(before)
  })
})

describe('createLabShell', () => {
  it('closes the room with floor, walls, ceiling and panels', () => {
    const shell = createLabShell({ width: 20, depth: 12, panels: 4 })
    const meshes = shell.children.filter((c) => c instanceof THREE.Mesh) as THREE.Mesh[]
    expect(meshes.length).toBeGreaterThanOrEqual(10)
    const panels = meshes.filter((m) => (m.material as THREE.MeshStandardMaterial).emissiveIntensity === 0.85)
    expect(panels.length).toBe(4)
  })
})

describe('createWorkbench', () => {
  it('carries seedling trays and a pulsing console', () => {
    const { fns, registerTick } = captureTick()
    const bench = createWorkbench({ trays: 3, registerTick })
    const seedlings = bench.children.filter((c) => c instanceof THREE.InstancedMesh) as THREE.InstancedMesh[]
    expect(seedlings.length).toBe(3)
    expect(fns.length).toBe(1)
    fns[0]!(0.016, 1)
  })
})
