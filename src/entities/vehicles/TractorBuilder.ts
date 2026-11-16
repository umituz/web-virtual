import * as THREE from 'three'
import type { WorldTickFn, UnregisterTick, EntityStatus } from '../../core/types'

/**
 * Procedural low-poly tractor (or towed implement) — big rear wheels, slim
 * fronts, cabin and exhaust. `status: 'running'` spins the wheels and adds
 * a subtle engine shiver via the engine tick loop.
 */

export interface TractorOptions {
  bodyColor?: string
  status?: EntityStatus
  scale?: number
  /** Front attachment — a mower/implement disc for working scenes. */
  implement?: 'none' | 'mower' | 'trailer'
  registerTick?: (fn: WorldTickFn) => UnregisterTick
  entityId?: string
}

export function createTractor(options: TractorOptions = {}): THREE.Group {
  const {
    bodyColor = '#2e7d32',
    status = 'idle',
    scale = 1,
    implement = 'none',
    registerTick,
    entityId,
  } = options

  const group = new THREE.Group()
  group.name = 'tractor'
  if (entityId) group.userData = { entityId }

  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.55, metalness: 0.15 })
  const darkMat = new THREE.MeshStandardMaterial({ color: '#25211c', roughness: 0.85 })
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#bfe3f2',
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.55,
  })

  // Chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.34, 1.5), bodyMat)
  chassis.position.y = 0.52
  chassis.castShadow = true
  group.add(chassis)

  // Hood sloping forward
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.34, 0.72), bodyMat)
  hood.position.set(0, 0.84, 0.32)
  hood.castShadow = true
  group.add(hood)

  // Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.62, 0.56), bodyMat)
  cabin.position.set(0, 1.14, -0.34)
  cabin.castShadow = true
  group.add(cabin)

  const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.4, 0.5), glassMat)
  cabGlass.position.set(0, 1.2, -0.33)
  group.add(cabGlass)

  // Exhaust
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.5, 6), darkMat)
  exhaust.position.set(0.26, 1.2, 0.5)
  group.add(exhaust)

  // Wheels — chunky rear, slim front, spin when running
  const wheels: THREE.Mesh[] = []
  const wheelSpecs: Array<{ r: number; w: number; x: number; z: number }> = [
    { r: 0.44, w: 0.3, x: 0.52, z: -0.42 },
    { r: 0.44, w: 0.3, x: -0.52, z: -0.42 },
    { r: 0.28, w: 0.2, x: 0.46, z: 0.62 },
    { r: 0.28, w: 0.2, x: -0.46, z: 0.62 },
  ]
  const hubGeo = new THREE.CylinderGeometry(1, 1, 1, 10)
  for (const spec of wheelSpecs) {
    const wheel = new THREE.Mesh(hubGeo, darkMat)
    wheel.scale.set(spec.r, spec.w, spec.r)
    wheel.rotation.z = Math.PI / 2
    wheel.position.set(spec.x, spec.r, spec.z)
    wheel.castShadow = true
    group.add(wheel)
    wheels.push(wheel)
  }

  // Implements
  if (implement === 'mower') {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.12), darkMat)
    bar.position.set(0, 0.34, 1.0)
    group.add(bar)
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 8), darkMat)
    disc.rotation.z = Math.PI / 2
    disc.position.set(0.6, 0.3, 1.0)
    group.add(disc)
  } else if (implement === 'trailer') {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.36, 1.3), bodyMat)
    bed.position.set(0, 0.5, -1.45)
    bed.castShadow = true
    group.add(bed)
    for (const [tx, tz] of [
      [0.42, -1.1],
      [-0.42, -1.1],
      [0.42, -1.8],
      [-0.42, -1.8],
    ] as const) {
      const tw = new THREE.Mesh(hubGeo, darkMat)
      tw.scale.set(0.26, 0.18, 0.26)
      tw.rotation.z = Math.PI / 2
      tw.position.set(tx, 0.26, tz)
      group.add(tw)
    }
  }

  group.scale.setScalar(scale)

  const running = status === 'running' || status === 'working'
  if (registerTick && running) {
    registerTick((delta, elapsed) => {
      for (const wheel of wheels) {
        wheel.rotation.x += delta * 5.2
      }
      // Engine idle shiver
      group.position.y = Math.sin(elapsed * 34) * 0.006
    })
  }

  return group
}
