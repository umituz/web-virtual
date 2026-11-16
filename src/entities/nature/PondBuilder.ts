import * as THREE from 'three'
import type { WorldTickFn, UnregisterTick } from '../../core/types'

/**
 * Procedural pond — a water disc sunk slightly below a muddy border, with
 * two ripple rings expanding outward forever. When `registerTick` is given
 * the ripples run on the engine loop; otherwise the tick is returned.
 */

export interface PondOptions {
  radius?: number
  waterColor?: string
  mudColor?: string
  /** Deterministic ripple phase. */
  seed?: number
  position?: [number, number, number]
  registerTick?: (fn: WorldTickFn) => UnregisterTick
}

export function createPond(options: PondOptions = {}): THREE.Group {
  const {
    radius = 3,
    waterColor = '#1d6a8f',
    mudColor = '#3f3a2c',
    seed = 3,
    position = [0, 0, 0],
    registerTick,
  } = options

  const group = new THREE.Group()
  group.name = 'pond'
  group.position.set(position[0], position[1], position[2])

  const mud = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 1.18, 24),
    new THREE.MeshStandardMaterial({ color: mudColor, roughness: 1 }),
  )
  mud.rotation.x = -Math.PI / 2
  mud.position.y = -0.02
  mud.receiveShadow = true
  group.add(mud)

  const waterMat = new THREE.MeshStandardMaterial({
    color: waterColor,
    roughness: 0.15,
    metalness: 0.35,
    transparent: true,
    opacity: 0.92,
  })
  const water = new THREE.Mesh(new THREE.CircleGeometry(radius, 28), waterMat)
  water.rotation.x = -Math.PI / 2
  water.position.y = 0.01
  group.add(water)

  const rippleMat = new THREE.MeshBasicMaterial({
    color: '#cfe8f3',
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  })
  const ripples: Array<{ mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>; offset: number }> = []
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.55, radius * 0.6, 28), rippleMat.clone())
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.02
    ring.position.x = (seed % 3 - 1) * radius * 0.25
    ring.position.z = ((seed + i) % 3 - 1) * radius * 0.2
    group.add(ring)
    ripples.push({ mesh: ring, offset: (i * 2.1) / ripples.length + seed * 0.37 })
  }

  const tick: WorldTickFn = (_delta, elapsed) => {
    for (const { mesh, offset } of ripples) {
      const cycle = (elapsed * 0.35 + offset) % 1
      const s = 0.3 + cycle * 1.5
      mesh.scale.setScalar(s)
      mesh.material.opacity = 0.38 * (1 - cycle)
    }
  }

  if (registerTick) {
    registerTick(tick)
  } else {
    group.userData.tick = tick
  }
  return group
}
