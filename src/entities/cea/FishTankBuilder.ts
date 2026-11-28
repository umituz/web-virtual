import * as THREE from 'three'
import type { WorldTickFn, UnregisterTick } from '../../core/types'
import { createRng } from '../../engine/random'

export interface FishTankOptions {
  width?: number
  depth?: number
  height?: number
  waterLevel?: number
  waterColor?: string
  glassColor?: string
  fishCount?: number
  fishColor?: string
  swimSpeed?: number
  registerTick?: (fn: WorldTickFn) => UnregisterTick
}

interface FishPath {
  radiusX: number
  radiusZ: number
  centerY: number
  phase: number
  speed: number
  tilt: number
}

export function createFishTank(options: FishTankOptions = {}): THREE.Group {
  const width = options.width ?? 3
  const depth = options.depth ?? 1.6
  const height = options.height ?? 1.1
  const waterLevel = options.waterLevel ?? 0.82
  const fishCount = Math.max(0, options.fishCount ?? 8)
  const swimSpeed = options.swimSpeed ?? 0.55

  const group = new THREE.Group()

  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({
      color: options.glassColor ?? '#bae6fd',
      transparent: true,
      opacity: 0.22,
      metalness: 0.1,
      roughness: 0.1,
    }),
  )
  glass.position.y = height / 2
  group.add(glass)

  const waterTop = height * waterLevel
  const water = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.08, waterTop, depth - 0.08),
    new THREE.MeshStandardMaterial({
      color: options.waterColor ?? '#0e7490',
      transparent: true,
      opacity: 0.5,
      roughness: 0.15,
      metalness: 0.05,
    }),
  )
  water.position.y = waterTop / 2
  group.add(water)

  const rimGeometry = new THREE.BoxGeometry(width + 0.1, 0.06, depth + 0.1)
  const rimMaterial = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.5, roughness: 0.5 })
  for (const y of [0.03, height - 0.03]) {
    const rim = new THREE.Mesh(rimGeometry, rimMaterial)
    rim.position.y = y
    group.add(rim)
  }

  const stand = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.2, 0.36, depth - 0.2),
    new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.35, roughness: 0.6 }),
  )
  stand.position.y = -0.18
  group.add(stand)

  let fish: THREE.InstancedMesh | null = null
  const paths: FishPath[] = []
  if (fishCount > 0) {
    const fishGeometry = new THREE.OctahedronGeometry(0.11)
    fishGeometry.scale(0.55, 0.7, 1.7)
    const fishMaterial = new THREE.MeshStandardMaterial({
      color: options.fishColor ?? '#f59e0b',
      roughness: 0.5,
      metalness: 0.2,
    })
    fish = new THREE.InstancedMesh(fishGeometry, fishMaterial, fishCount)

    const rng = createRng(53)
    for (let i = 0; i < fishCount; i += 1) {
      paths.push({
        radiusX: 0.25 + rng() * (width / 2 - 0.5),
        radiusZ: 0.15 + rng() * (depth / 2 - 0.35),
        centerY: 0.2 + rng() * (waterTop - 0.45),
        phase: rng() * Math.PI * 2,
        speed: swimSpeed * (0.7 + rng() * 0.7) * (rng() > 0.5 ? 1 : -1),
        tilt: (rng() - 0.5) * 0.5,
      })
    }
    group.add(fish)
  }

  if (options.registerTick && fish) {
    const dummy = new THREE.Object3D()
    options.registerTick((_delta, elapsed) => {
      for (let i = 0; i < fishCount; i += 1) {
        const p = paths[i]
        if (!p) continue
        const angle = p.phase + elapsed * p.speed
        const x = Math.cos(angle) * p.radiusX
        const z = Math.sin(angle) * p.radiusZ
        const y = p.centerY + Math.sin(angle * 2 + p.phase) * 0.05
        const nextX = Math.cos(angle + 0.12 * Math.sign(p.speed)) * p.radiusX
        const nextZ = Math.sin(angle + 0.12 * Math.sign(p.speed)) * p.radiusZ
        dummy.position.set(x, y, z)
        dummy.lookAt(nextX, y, nextZ)
        dummy.rotateZ(p.tilt)
        const wiggle = 1 + Math.sin(elapsed * 6 + p.phase) * 0.12
        dummy.scale.set(1, 1, wiggle)
        dummy.updateMatrix()
        fish.setMatrixAt(i, dummy.matrix)
      }
      fish.instanceMatrix.needsUpdate = true
      water.position.y = waterTop / 2 + Math.sin(elapsed * 0.9) * 0.008
    })
  }

  return group
}
