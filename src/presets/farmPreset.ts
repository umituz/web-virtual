import * as THREE from 'three'
import type { WorldPreset, WorldSlot, WorldZone } from '../core/types'
import { createCropPlot } from '../entities/nature/CropFieldBuilder'
import { createTree, createTreeRow, applyWindSway } from '../entities/nature/TreeBuilder'
import { createFence } from '../entities/nature/FenceBuilder'
import { createPond } from '../entities/nature/PondBuilder'
import { createHerd } from '../entities/animals/AnimalBuilder'
import { createTractor } from '../entities/vehicles/TractorBuilder'
import {
  createBarn,
  createSilo,
  createGreenhouse,
  createMachineShed,
  createCoop,
} from '../entities/architecture/FarmArchitectureBuilder'

export const DEFAULT_FARM_ZONES: WorldZone[] = [
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    color: '#22c55e',
    description: 'Climate-controlled growing area with benches and irrigation.',
    cameraFocus: [-13, 1.2, -4],
  },
  {
    id: 'crop_fields',
    name: 'Crop Fields',
    color: '#84cc16',
    description: 'Open planting beds at varying growth stages.',
    cameraFocus: [4, 0.8, -6],
  },
  {
    id: 'pasture',
    name: 'Pasture',
    color: '#a3e635',
    description: 'Grazing herds and the watering pond.',
    cameraFocus: [4, 0.8, 8],
  },
  {
    id: 'barn_storage',
    name: 'Barn & Storage',
    color: '#b45309',
    description: 'Barn, silo and the machinery yard.',
    cameraFocus: [-9, 1.4, 8],
  },
  {
    id: 'poultry',
    name: 'Poultry Yard',
    color: '#f59e0b',
    description: 'Coop and free-range chicken run.',
    cameraFocus: [-15, 0.8, 10],
  },
]

export const FARM_SLOTS: WorldSlot[] = [
  { id: 'slot-1', label: 'Greenhouse station', position: [-13, 0, -4], zoneId: 'greenhouse', pinNumber: 1, avatarColor: '#15803d' },
  { id: 'slot-2', label: 'Crop field unit', position: [4, 0, -6], zoneId: 'crop_fields', pinNumber: 2 },
  { id: 'slot-3', label: 'Pasture station', position: [4, 0, 8], zoneId: 'pasture', pinNumber: 3, avatarColor: '#65a30d' },
  { id: 'slot-4', label: 'Barn & logistics station', position: [-9, 0, 8], zoneId: 'barn_storage', pinNumber: 4, avatarColor: '#b45309' },
  { id: 'slot-5', label: 'Poultry station', position: [-15, 0, 10], zoneId: 'poultry', pinNumber: 5, avatarColor: '#f59e0b' },
]

export const farmPreset: WorldPreset = {
  id: 'preset-farm',
  name: 'Smart Agriculture & Greenhouse Complex',
  type: 'farm',
  description:
    'Agricultural farm with greenhouses, staged crop plots, grazing herds, a pond, machinery yard and a poultry run.',
  dimensions: {
    width: 44,
    height: 10,
    depth: 30,
  },
  camera: {
    position: [30, 22, 30],
    target: [-2, 0, 1],
    fov: 42,
    minDistance: 6,
    maxDistance: 80,
  },
  lighting: {
    ambientColor: '#f0fdf4',
    ambientIntensity: 0.9,
    sunColor: '#fef08a',
    sunIntensity: 1.25,
    sunPosition: [25, 35, 20],
    shadows: true,
  },
  theme: {
    name: 'farm-nature',
    floorColor: '#365314',
    woodFloorColor: '#78350f',
    wallColor: '#fef9c3',
    wallFrameColor: '#1c1917',
    glassColor: '#bbf7d0',
    glassOpacity: 0.22,
    accentColor: '#22c55e',
    backgroundColor: '#cfe4d8',
    nightBackgroundColor: '#0a1420',
  },
  zones: DEFAULT_FARM_ZONES,
  slots: FARM_SLOTS,

  buildScene: (scene, options) => {
    // 1. Ground — grass plane with a soil work strip
    const grassMat = new THREE.MeshStandardMaterial({ color: '#679a4c', roughness: 1 })
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(46, 32), grassMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // 2. Crop fields — four plots at staggered growth stages
    const plots: Array<{ x: number; z: number; growth: number; color: string; rows: number }> = [
      { x: 1, z: -9, growth: 0.85, color: '#5d8a2a', rows: 6 },
      { x: 10, z: -9, growth: 0.45, color: '#7ba72f', rows: 5 },
      { x: 1, z: -1, growth: 0.2, color: '#8fbf3f', rows: 6 },
      { x: 10, z: -1, growth: 0.65, color: '#4d7c0f', rows: 5 },
    ]
    for (const plot of plots) {
      const p = createCropPlot({
        width: 7.5,
        depth: 6,
        rows: plot.rows,
        growth: plot.growth,
        cropColor: plot.color,
        seed: 5 + plot.x + plot.z,
      })
      p.position.set(plot.x, 0, plot.z)
      scene.add(p)
    }

    // 3. Greenhouse with interior benches
    scene.add(
      createGreenhouse({
        width: 9,
        depth: 6.4,
        position: [-13, 0, -5.5],
        benches: [
          { color: '#3f8f3a', growth: 0.7 },
          { color: '#58a34e', growth: 0.5 },
          { color: '#77b852', growth: 0.9 },
        ],
      }),
    )

    // 4. Pasture — fenced paddock, cow herd, sheep, pond with ripples
    const paddock = createFence({
      points: [
        [-1, 0, 4.5],
        [12.5, 0, 4.5],
        [12.5, 0, 13],
        [-1, 0, 13],
        [-1, 0, 4.5],
      ],
    })
    scene.add(paddock)

    scene.add(
      createHerd({
        species: 'cow',
        count: 5,
        area: { width: 9, depth: 5.5 },
        center: [2.5, 0, 8.2],
        registerTick: options.registerTick,
      }),
    )
    scene.add(
      createHerd({
        species: 'sheep',
        count: 6,
        area: { width: 4, depth: 4 },
        center: [9, 0, 10.5],
        scale: 0.9,
        seed: 41,
        registerTick: options.registerTick,
      }),
    )

    const pond = createPond({
      radius: 2.4,
      position: [9.4, 0, 6.2],
      registerTick: options.registerTick,
    })
    scene.add(pond)

    // 5. Barnyard — barn, silo, machine shed, working tractor
    scene.add(createBarn({ width: 9, depth: 6.5, position: [-9, 0, 8.5] }))
    scene.add(createSilo({ radius: 1.3, height: 5.5, position: [-14.4, 0, 8.5] }))
    scene.add(
      createMachineShed({ width: 8, depth: 5, position: [-8.5, 0, 14], rotationY: Math.PI }),
    )

    const tractorWorking = createTractor({
      status: 'running',
      implement: 'mower',
      registerTick: options.registerTick,
    })
    tractorWorking.position.set(6.5, 0, -4.5)
    tractorWorking.rotation.y = -Math.PI / 2
    scene.add(tractorWorking)

    const tractorParked = createTractor({
      bodyColor: '#1d6fb8',
      status: 'idle',
      implement: 'trailer',
    })
    tractorParked.position.set(-6.2, 0, 13.8)
    tractorParked.rotation.y = Math.PI
    scene.add(tractorParked)

    // 6. Poultry yard
    scene.add(createCoop({ position: [-15.5, 0, 12.5], rotationY: 0.5 }))
    scene.add(
      createHerd({
        species: 'chicken',
        count: 7,
        area: { width: 3.4, depth: 3 },
        center: [-14.6, 0, 14.6],
        seed: 77,
        registerTick: options.registerTick,
      }),
    )

    // 7. Windbreak tree rows swaying in the breeze
    const northRow = createTreeRow({ count: 8, spacing: 3.2, axis: 'x', shape: 'broad', height: 4.6, season: 'summer' })
    northRow.position.set(0, 0, -14.5)
    scene.add(northRow)
    applyWindSway(northRow, options.registerTick, { intensity: 0.022, speed: 1.2 })

    const eastRow = createTreeRow({ count: 5, spacing: 3.2, axis: 'z', shape: 'conifer', height: 5.2 })
    eastRow.position.set(16.5, 0, 2)
    scene.add(eastRow)
    applyWindSway(eastRow, options.registerTick, { intensity: 0.016, speed: 0.9, phase: 1.9 })

    // A few orchard-style round trees near the greenhouse
    for (const [tx, tz] of [
      [-17.5, 0.5],
      [-17.5, 3.5],
      [-16, -10.5],
    ] as const) {
      const tree = createTree({ shape: 'round', height: 3.6, season: 'autumn', seed: tx * 7 + tz })
      tree.position.set(tx, 0, tz)
      scene.add(tree)
      applyWindSway(tree, options.registerTick, { intensity: 0.02, speed: 1.5, phase: tx })
    }
  },
}
