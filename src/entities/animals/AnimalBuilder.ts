import * as THREE from 'three'
import { createRng, phaseFor } from '../../engine/random'
import type { WorldTickFn, UnregisterTick } from '../../core/types'

/**
 * Procedural low-poly farm animals and herds. Each animal pivots at the
 * ground with a named `head` node so the grazing bob (head dips toward the
 * grass and back up) animates without touching the body. Herds scatter
 * deterministically from a seed — same seed, same scene, every time.
 */

export type AnimalSpecies = 'cow' | 'sheep' | 'goat' | 'chicken'

export interface AnimalOptions {
  species?: AnimalSpecies
  bodyColor?: string
  /** Uniform scale multiplier. */
  scale?: number
  /** Deterministic silhouette seed. */
  seed?: number
}

const SPECIES_DEFAULTS: Record<
  AnimalSpecies,
  { body: string; accent: string; bodyW: number; bodyH: number; bodyD: number; legH: number; headScale: number }
> = {
  cow: { body: '#f5f0e6', accent: '#3d3630', bodyW: 0.62, bodyH: 0.5, bodyD: 1.05, legH: 0.42, headScale: 1 },
  sheep: { body: '#ece7db', accent: '#4a4038', bodyW: 0.46, bodyH: 0.44, bodyD: 0.72, legH: 0.3, headScale: 0.8 },
  goat: { body: '#cbb8a0', accent: '#6b5a45', bodyW: 0.4, bodyH: 0.42, bodyD: 0.68, legH: 0.36, headScale: 0.75 },
  chicken: { body: '#f8f4ec', accent: '#c2452d', bodyW: 0.2, bodyH: 0.22, bodyD: 0.28, legH: 0.12, headScale: 0.5 },
}

export function createAnimal(options: AnimalOptions = {}): THREE.Group {
  const { species = 'cow', bodyColor, scale = 1, seed = 1 } = options
  const d = SPECIES_DEFAULTS[species]
  const rng = createRng(seed)

  const group = new THREE.Group()
  group.name = `animal-${species}`

  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor ?? d.body,
    roughness: 0.95,
  })
  const accentMat = new THREE.MeshStandardMaterial({ color: d.accent, roughness: 0.9 })

  // Body — box with slight per-animal size jitter
  const bw = d.bodyW * (0.9 + rng() * 0.2)
  const bh = d.bodyH * (0.9 + rng() * 0.2)
  const bd = d.bodyD * (0.9 + rng() * 0.2)
  const body = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), bodyMat)
  body.position.y = d.legH + bh / 2
  body.castShadow = true
  group.add(body)

  // Patch on cows / sheep (a darker back patch reads as a breed marker)
  if (species === 'cow' || species === 'sheep') {
    const patch = new THREE.Mesh(
      new THREE.BoxGeometry(bw * 1.02, bh * 0.5, bd * (0.3 + rng() * 0.3)),
      accentMat,
    )
    patch.position.set(0, d.legH + bh * 0.85, (rng() - 0.5) * bd * 0.4)
    group.add(patch)
  }

  // Head — child of a neck pivot at the front of the body so grazing rotates naturally
  const neck = new THREE.Group()
  neck.name = 'animal-neck'
  neck.position.set(0, d.legH + bh * 0.75, bd / 2)
  group.add(neck)

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(bw * 0.45 * d.headScale, bh * 0.5 * d.headScale, bw * 0.5 * d.headScale),
    species === 'chicken' ? accentMat : bodyMat,
  )
  head.name = 'animal-head'
  head.position.set(0, bh * 0.15, bw * 0.28 * d.headScale)
  head.castShadow = true
  neck.add(head)

  if (species === 'chicken') {
    const comb = new THREE.Mesh(
      new THREE.BoxGeometry(bw * 0.12, bh * 0.22, bw * 0.2),
      accentMat,
    )
    comb.position.set(0, bh * 0.42, 0)
    neck.add(comb)
    const beak = new THREE.Mesh(
      new THREE.ConeGeometry(bw * 0.07, bh * 0.22, 4),
      new THREE.MeshStandardMaterial({ color: '#d9a441', roughness: 0.8 }),
    )
    beak.rotation.x = Math.PI / 2
    beak.position.set(0, bh * 0.05, bw * 0.55 * d.headScale)
    neck.add(beak)
  } else {
    // Ears / horns
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(
        new THREE.BoxGeometry(bw * 0.12, bh * 0.14, bw * 0.08),
        accentMat,
      )
      ear.position.set(side * bw * 0.25 * d.headScale, bh * 0.28, -bw * 0.05)
      neck.add(ear)
    }
    if (species === 'goat') {
      for (const side of [-1, 1]) {
        const horn = new THREE.Mesh(
          new THREE.ConeGeometry(bw * 0.05, bh * 0.35, 4),
          accentMat,
        )
        horn.position.set(side * bw * 0.14, bh * 0.45, -bw * 0.1)
        horn.rotation.z = side * 0.35
        neck.add(horn)
      }
    }
  }

  // Legs (chickens get slim cylinder legs; others chunky boxes)
  const legGeo =
    species === 'chicken'
      ? new THREE.CylinderGeometry(0.015, 0.015, d.legH, 4)
      : new THREE.BoxGeometry(bw * 0.16, d.legH, bw * 0.16)
  for (const [lx, lz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    const leg = new THREE.Mesh(legGeo, accentMat)
    leg.position.set((lx * bw) / 2.6, d.legH / 2, (lz * bd) / 2.25)
    group.add(leg)
  }

  // Tail
  const tail = new THREE.Mesh(
    new THREE.BoxGeometry(bw * 0.12, bh * 0.3, bw * 0.08),
    species === 'chicken' ? bodyMat : accentMat,
  )
  tail.position.set(0, d.legH + bh * 0.9, -bd / 2 - bw * 0.02)
  tail.name = 'animal-tail'
  group.add(tail)

  group.scale.setScalar(scale)
  return group
}

export interface HerdOptions {
  species?: AnimalSpecies
  count?: number
  /** Rectangular grazing area in meters, centered on the group origin. */
  area?: { width: number; depth: number }
  center?: [number, number, number]
  /** Coat variations cycled through the herd. */
  bodyColors?: string[]
  scale?: number
  seed?: number
  /** Grazing bob + occasional re-orientation, stepped by the engine loop. */
  registerTick?: (fn: WorldTickFn) => UnregisterTick
  /** Links every animal to one entity for raycast selection. */
  entityId?: string
}

export function createHerd(options: HerdOptions = {}): THREE.Group {
  const {
    species = 'cow',
    count = 5,
    area = { width: 8, depth: 8 },
    center = [0, 0, 0],
    bodyColors,
    scale = 1,
    seed = 11,
    registerTick,
    entityId,
  } = options

  const group = new THREE.Group()
  group.name = `herd-${species}`
  group.position.set(center[0], center[1], center[2])
  if (entityId) group.userData = { entityId }

  const rng = createRng(seed)
  const necks: Array<{ neck: THREE.Group; phase: number; base: number }> = []

  for (let i = 0; i < count; i++) {
    const animal = createAnimal({
      species,
      seed: seed + i * 17,
      scale: scale * (0.92 + rng() * 0.16),
      bodyColor: bodyColors?.[bodyColors.length > 0 ? i % bodyColors.length : 0],
    })
    animal.position.set(
      (rng() - 0.5) * area.width * 0.86,
      0,
      (rng() - 0.5) * area.depth * 0.86,
    )
    animal.rotation.y = rng() * Math.PI * 2
    if (entityId) animal.userData = { entityId }
    group.add(animal)

    const neck = animal.getObjectByName('animal-neck') as THREE.Group | null
    if (neck) {
      necks.push({ neck, phase: phaseFor(seed, i), base: neck.rotation.x })
    }
  }

  if (registerTick && necks.length > 0) {
    registerTick((_delta, elapsed) => {
      for (const { neck, phase, base } of necks) {
        // Slow graze cycle: head down into the grass, hold, lift, look around
        const cycle = Math.sin(elapsed * 0.55 + phase)
        const look = Math.sin(elapsed * 0.3 + phase * 1.7) * 0.22
        neck.rotation.x = base + Math.max(0, cycle) * 0.75
        neck.rotation.y = look
      }
    })
  }

  return group
}
