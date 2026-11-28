import * as THREE from 'three'
import type { WorldPreset, WorldSlot, WorldZone } from '../core/types'
import { createLabShell } from '../entities/cea/LabArchitectureBuilder'
import { createGrowRack } from '../entities/cea/GrowRackBuilder'
import { createVerticalTower } from '../entities/cea/TowerBuilder'
import { createFishTank } from '../entities/cea/FishTankBuilder'
import { createHydroLoop } from '../entities/cea/HydroLoopBuilder'
import { createClimateUnit } from '../entities/cea/ClimateUnitBuilder'
import { createWorkbench } from '../entities/cea/WorkbenchBuilder'
import { createMistField } from '../engine/particles'

const WIDTH = 22
const DEPTH = 14

const ZONES: WorldZone[] = [
  {
    id: 'zone-grow',
    name: 'Grow rows',
    color: '#38bdf8',
    bounds: { minX: -10, maxX: 1, minZ: -4, maxZ: 4 },
    cameraFocus: [-4, 1.8, 0],
  },
  {
    id: 'zone-tower',
    name: 'Tower aisle',
    color: '#a78bfa',
    bounds: { minX: 1, maxX: 7, minZ: -6.5, maxZ: -1.5 },
    cameraFocus: [4, 2.2, -4],
  },
  {
    id: 'zone-aqua',
    name: 'Aquaponics',
    color: '#0ea5e9',
    bounds: { minX: 3, maxX: 9, minZ: 0.5, maxZ: 5 },
    cameraFocus: [5.5, 0.9, 2.5],
  },
  {
    id: 'zone-propagation',
    name: 'Propagation',
    color: '#4ade80',
    bounds: { minX: 1, maxX: 8, minZ: -6.8, maxZ: -4.8 },
    cameraFocus: [4, 1, -5.6],
  },
  {
    id: 'zone-climate',
    name: 'Climate control',
    color: '#f59e0b',
    bounds: { minX: -11, maxX: 11, minZ: -7, maxZ: -6 },
    cameraFocus: [0, 4.4, -6],
  },
]

export const VERTICAL_LAB_SLOTS: WorldSlot[] = [
  {
    id: 'slot-console',
    label: 'Climate console',
    position: [6.6, 0, -5.4],
    rotation: [0, Math.PI, 0],
    zoneId: 'zone-propagation',
    pinNumber: 1,
    avatarColor: '#f59e0b',
    metadata: { station: 'climate-console' },
  },
  {
    id: 'slot-bench-1',
    label: 'Propagation bench 1',
    position: [3.2, 0, -5.4],
    rotation: [0, Math.PI, 0],
    zoneId: 'zone-propagation',
    pinNumber: 2,
    avatarColor: '#4ade80',
    metadata: { station: 'seed-bench' },
  },
  {
    id: 'slot-bench-2',
    label: 'Propagation bench 2',
    position: [4.6, 0, -5.4],
    rotation: [0, Math.PI, 0],
    zoneId: 'zone-propagation',
    pinNumber: 3,
    avatarColor: '#4ade80',
    metadata: { station: 'seed-bench' },
  },
  {
    id: 'slot-rack-a',
    label: 'Grow rack A aisle',
    position: [-4, 0, -0.4],
    rotation: [0, 0, 0],
    zoneId: 'zone-grow',
    pinNumber: 4,
    avatarColor: '#38bdf8',
    metadata: { station: 'grow-rack', rack: 'A' },
  },
  {
    id: 'slot-rack-b',
    label: 'Grow rack B aisle',
    position: [-4, 0, 3.6],
    rotation: [0, Math.PI, 0],
    zoneId: 'zone-grow',
    pinNumber: 5,
    avatarColor: '#38bdf8',
    metadata: { station: 'grow-rack', rack: 'B' },
  },
  {
    id: 'slot-tank',
    label: 'Fish tank station',
    position: [5.5, 0, 4.4],
    rotation: [0, Math.PI, 0],
    zoneId: 'zone-aqua',
    pinNumber: 6,
    avatarColor: '#0ea5e9',
    metadata: { station: 'fish-tank' },
  },
]

export const verticalLabPreset: WorldPreset = {
  id: 'vertical-lab',
  name: 'Vertical Farm Laboratory',
  type: 'vertical-farm',
  description:
    'Closed-environment cultivation laboratory — tiered grow racks under LED photoperiod, vertical fog towers, an aquaponic fish loop and ceiling climate units.',
  dimensions: { width: WIDTH, height: 6, depth: DEPTH },
  camera: {
    position: [15, 9.5, 17],
    target: [0, 2, 0],
    fov: 42,
    near: 0.1,
    far: 200,
    minDistance: 4,
    maxDistance: 38,
    maxPolarAngle: Math.PI / 2 - 0.04,
  },
  lighting: {
    ambientColor: '#dfe8ff',
    ambientIntensity: 0.55,
    sunColor: '#e2e8f0',
    sunIntensity: 0.18,
    sunPosition: [8, 24, 10],
    nightAmbientColor: '#111827',
    nightAmbientIntensity: 0.12,
    nightSunColor: '#334155',
    nightSunIntensity: 0.1,
    shadows: true,
    interiorSpots: false,
  },
  theme: {
    name: 'vertical-lab',
    floorColor: '#dde5ee',
    wallColor: '#e7edf5',
    wallFrameColor: '#94a3b8',
    glassColor: '#a5d8f3',
    glassOpacity: 0.3,
    accentColor: '#38bdf8',
    gridColor: '#94a3b8',
    backgroundColor: '#0b1220',
    nightBackgroundColor: '#04060c',
  },
  effects: {
    bloom: { strength: 0.7, radius: 0.55, threshold: 0.68 },
  },
  zones: ZONES,
  slots: VERTICAL_LAB_SLOTS,
  buildScene(scene: THREE.Scene, { registerTick }) {
    scene.add(createLabShell({ width: WIDTH, depth: DEPTH, height: 5.4, panels: 5 }))

    const rackA = createGrowRack({
      width: 9,
      depth: 1.3,
      tiers: 4,
      tierHeight: 1.05,
      trays: { growth: 0.55, plantColor: '#22c55e' },
      led: { spectrum: 'vegetative', periodSeconds: 26, onFraction: 0.72 },
      registerTick,
    })
    rackA.position.set(-4, 0, -2.6)
    scene.add(rackA)

    const rackB = createGrowRack({
      width: 9,
      depth: 1.3,
      tiers: 5,
      tierHeight: 0.95,
      trays: { growth: 0.8, plantColor: '#4ade80' },
      led: { spectrum: 'full', periodSeconds: 26, onFraction: 0.72 },
      registerTick,
    })
    rackB.position.set(-4, 0, 2.2)
    scene.add(rackB)

    const towerPositions = [2.6, 4.1, 5.6]
    towerPositions.forEach((x, i) => {
      const tower = createVerticalTower({
        height: 2.9,
        pocketRows: 6,
        pocketsPerRow: 4,
        growth: 0.35 + i * 0.25,
        plantColor: '#86efac',
        mist: true,
        registerTick,
      })
      tower.position.set(x, 0, -4)
      scene.add(tower)
    })

    const tank = createFishTank({
      width: 3,
      depth: 1.6,
      height: 1.1,
      fishCount: 9,
      registerTick,
    })
    tank.position.set(5.5, 0.36, 2.5)
    scene.add(tank)

    scene.add(
      createHydroLoop({
        points: [
          [5.5, 1.1, 1.7],
          [2, 1.7, 0.4],
          [-2, 2.1, -0.6],
          [-8.4, 2.1, -0.6],
          [-8.4, 1.4, -2.6],
          [-2, 1.1, -2.6],
          [2, 0.8, 1.2],
          [5.5, 0.6, 3.1],
        ],
        flowSpeed: 0.06,
        dashCount: 18,
        registerTick,
      }),
    )

    for (const x of [-8.5, 8.5]) {
      const unit = createClimateUnit({ fanSpeed: 6, registerTick })
      unit.position.set(x, 4.35, -5.6)
      scene.add(unit)
    }

    const bench = createWorkbench({ width: 4.4, trays: 3, trayGrowth: 0.22, registerTick })
    bench.position.set(4.2, 0, -5.9)
    bench.rotation.y = Math.PI
    scene.add(bench)

    scene.add(
      createMistField({
        width: 4.4,
        depth: 1.6,
        baseHeight: 2,
        riseHeight: 1.4,
        count: 70,
        color: '#e0f2fe',
        opacity: 0.16,
        registerTick,
        seed: 11,
      }),
    )
    const aisleMist = createMistField({
      width: WIDTH - 4,
      depth: 6,
      baseHeight: 0.2,
      riseHeight: 2.6,
      count: 60,
      color: '#eef4ff',
      opacity: 0.08,
      size: 0.22,
      registerTick,
      seed: 29,
    })
    aisleMist.position.set(-4, 0, 0)
    scene.add(aisleMist)
  },
}
