import * as THREE from 'three'
import type { WorldTickFn, UnregisterTick } from '../core/types'
import { createRng } from './random'

export interface MistFieldOptions {
  width?: number
  depth?: number
  baseHeight?: number
  riseHeight?: number
  count?: number
  color?: string
  size?: number
  opacity?: number
  speed?: number
  drift?: number
  seed?: number
  registerTick?: (fn: WorldTickFn) => UnregisterTick
}

export function createMistField(options: MistFieldOptions = {}): THREE.Points {
  const width = options.width ?? 6
  const depth = options.depth ?? 2
  const baseHeight = options.baseHeight ?? 0.4
  const riseHeight = options.riseHeight ?? 2.2
  const count = options.count ?? 90
  const speed = options.speed ?? 0.16
  const drift = options.drift ?? 0.35
  const rand = createRng(options.seed ?? 7)

  const positions = new Float32Array(count * 3)
  const seeds: number[] = []
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (rand() - 0.5) * width
    positions[i * 3 + 1] = baseHeight + rand() * riseHeight
    positions[i * 3 + 2] = (rand() - 0.5) * depth
    seeds.push(rand() * Math.PI * 2)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({
    color: new THREE.Color(options.color ?? '#dbeafe'),
    size: options.size ?? 0.16,
    transparent: true,
    opacity: options.opacity ?? 0.32,
    depthWrite: false,
    sizeAttenuation: true,
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false

  if (options.registerTick) {
    const pos = geometry.attributes.position as THREE.BufferAttribute
    options.registerTick((_delta, elapsed) => {
      for (let i = 0; i < count; i += 1) {
        const phase = seeds[i] ?? 0
        const rise = ((elapsed * speed + phase) % (Math.PI * 2)) / (Math.PI * 2)
        pos.setY(i, baseHeight + rise * riseHeight)
        pos.setX(i, pos.getX(i) * (1 - 0.002) + Math.sin(elapsed * 0.7 + phase) * drift * 0.002)
      }
      pos.needsUpdate = true
    })
  }

  return points
}
