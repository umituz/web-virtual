import * as THREE from 'three'
import { createRng, jitter } from '../../engine/random'
import type { WorldTickFn, UnregisterTick } from '../../core/types'

/**
 * Procedural low-poly trees — a trunk plus layered foliage blobs (round /
 * broad) or stacked cones (conifer). Winter trees drop their foliage. All
 * trees pivot at their base so `applyWindSway` can rock them naturally.
 */

export type TreeSeason = 'spring' | 'summer' | 'autumn' | 'winter'
export type TreeShape = 'round' | 'conifer' | 'broad'

export interface TreeOptions {
  /** Overall height in meters (3–8 reads well at farm scale). */
  height?: number
  trunkColor?: string
  foliageColor?: string
  /** Season preset — autumn warms the foliage, winter strips it. */
  season?: TreeSeason
  shape?: TreeShape
  /** Deterministic silhouette seed. */
  seed?: number
}

const SEASON_FOLIAGE: Record<TreeSeason, string | null> = {
  spring: '#7bc96f',
  summer: '#3f7d3a',
  autumn: '#d97706',
  winter: null,
}

export function createTree(options: TreeOptions = {}): THREE.Group {
  const {
    height = 4.5,
    trunkColor = '#6b4a2f',
    foliageColor,
    season = 'summer',
    shape = 'round',
    seed = 1,
  } = options

  const rng = createRng(seed)
  const group = new THREE.Group()
  group.name = 'tree'

  const trunkMat = new THREE.MeshStandardMaterial({ color: trunkColor, roughness: 0.95 })
  const trunkH = height * (shape === 'conifer' ? 0.28 : 0.42)
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(height * 0.025, height * 0.045, trunkH, 6),
    trunkMat,
  )
  trunk.position.y = trunkH / 2
  trunk.castShadow = true
  group.add(trunk)

  const leafColor = foliageColor ?? SEASON_FOLIAGE[season]
  if (leafColor) {
    const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.9 })
    const foliage = new THREE.Group()
    foliage.name = 'tree-foliage'

    if (shape === 'conifer') {
      const tiers = 3
      for (let i = 0; i < tiers; i++) {
        const t = i / tiers
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(
            height * 0.26 * (1 - t * 0.55),
            height * 0.34 * (1 - t * 0.25),
            7,
          ),
          leafMat,
        )
        cone.position.y = trunkH + height * 0.22 + t * height * 0.3
        cone.castShadow = true
        cone.userData.windLayer = i
        foliage.add(cone)
      }
    } else {
      const blobs = shape === 'broad' ? 4 : 3
      for (let i = 0; i < blobs; i++) {
        const blob = new THREE.Mesh(
          new THREE.IcosahedronGeometry(jitter(rng, height * 0.19, height * 0.04), 0),
          leafMat,
        )
        const angle = (i / blobs) * Math.PI * 2 + rng() * 0.8
        blob.position.set(
          Math.cos(angle) * height * (shape === 'broad' ? 0.13 : 0.07),
          trunkH + height * 0.28 + (i % 2) * height * 0.1,
          Math.sin(angle) * height * (shape === 'broad' ? 0.13 : 0.07),
        )
        blob.castShadow = true
        blob.userData.windLayer = i % 2
        foliage.add(blob)
      }
    }
    group.add(foliage)
  }

  return group
}

export interface TreeRowOptions extends TreeOptions {
  count?: number
  /** Gap between trunks in meters. */
  spacing?: number
  /** Row axis — trees line up along it, centered on the group origin. */
  axis?: 'x' | 'z'
}

/** A windbreak / avenue line of trees with per-tree silhouette variation. */
export function createTreeRow(options: TreeRowOptions = {}): THREE.Group {
  const { count = 6, spacing = 3, axis = 'x', seed = 1, ...tree } = options
  const group = new THREE.Group()
  group.name = 'tree-row'

  for (let i = 0; i < count; i++) {
    const t = createTree({ ...tree, seed: seed + i * 31 })
    const pos = (i - (count - 1) / 2) * spacing
    if (axis === 'x') {
      t.position.x = pos
    } else {
      t.position.z = pos
    }
    group.add(t)
  }
  return group
}

export interface WindSwayOptions {
  /** Max lean angle in radians (0.01–0.05 is a light breeze). */
  intensity?: number
  /** Oscillations per second. */
  speed?: number
  /** Phase offset so neighbouring objects don't move in lockstep. */
  phase?: number
}

/**
 * Rock an object (or group of trees) with a sine sway around its base.
 * Registers onto the engine tick loop when `registerTick` is provided,
 * otherwise returns the tick function for manual stepping.
 */
export function applyWindSway(
  target: THREE.Object3D,
  registerTick?: (fn: WorldTickFn) => UnregisterTick,
  options: WindSwayOptions = {},
): WorldTickFn {
  const { intensity = 0.028, speed = 1.4, phase = 0 } = options

  const swayable: Array<{ obj: THREE.Object3D; layer: number; phase: number }> = []
  target.traverse((obj) => {
    if (obj.userData && typeof obj.userData.windLayer === 'number') {
      swayable.push({ obj, layer: obj.userData.windLayer as number, phase: (obj.id % 97) / 97 })
    }
  })
  // Whole-object fallback when nothing tagged windLayer (e.g. crop groups)
  if (swayable.length === 0) {
    swayable.push({ obj: target, layer: 0, phase })
  }

  const tick: WorldTickFn = (_delta, elapsed) => {
    const t = elapsed * speed + phase
    for (const { obj, layer, phase: p } of swayable) {
      const wobble = Math.sin(t + p + layer * 0.7)
      obj.rotation.z = wobble * intensity
      obj.rotation.x = Math.cos(t * 0.7 + p) * intensity * 0.5
    }
  }

  if (registerTick) {
    registerTick(tick)
  }
  return tick
}
