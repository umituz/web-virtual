import * as THREE from 'three'
import type { WorldTickFn, UnregisterTick } from '../../core/types'
import { createPhotoperiod } from '../../engine/animation'

export type LedSpectrum = 'vegetative' | 'flowering' | 'full'

export const LED_SPECTRUM_COLORS: Record<LedSpectrum, string> = {
  vegetative: '#5aa2ff',
  flowering: '#ff6a4d',
  full: '#fff1d6',
}

export interface LedBarOptions {
  length?: number
  width?: number
  spectrum?: LedSpectrum
  intensity?: number
  periodSeconds?: number
  onFraction?: number
  fadeFraction?: number
  castLight?: boolean
  lightDistance?: number
  registerTick?: (fn: WorldTickFn) => UnregisterTick
}

export function createLedBar(options: LedBarOptions = {}): THREE.Group {
  const length = options.length ?? 4
  const width = options.width ?? 0.14
  const spectrum = options.spectrum ?? 'full'
  const intensity = options.intensity ?? 2.4
  const color = new THREE.Color(LED_SPECTRUM_COLORS[spectrum])

  const group = new THREE.Group()

  const barGeometry = new THREE.BoxGeometry(length, 0.06, width)
  const barMaterial = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    emissive: color,
    emissiveIntensity: intensity,
    metalness: 0.4,
    roughness: 0.4,
  })
  group.add(new THREE.Mesh(barGeometry, barMaterial))

  const diffuserGeometry = new THREE.BoxGeometry(length * 0.96, 0.02, width * 1.5)
  const diffuserMaterial = new THREE.MeshStandardMaterial({
    color: color.clone().lerp(new THREE.Color('#ffffff'), 0.35),
    emissive: color,
    emissiveIntensity: intensity * 0.7,
    transparent: true,
    opacity: 0.85,
  })
  const diffuser = new THREE.Mesh(diffuserGeometry, diffuserMaterial)
  diffuser.position.y = -0.05
  group.add(diffuser)

  for (const x of [-length / 2 + 0.08, length / 2 - 0.08]) {
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.1, width + 0.04),
      new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.6, roughness: 0.5 }),
    )
    cap.position.set(x, 0, 0)
    group.add(cap)
  }

  let light: THREE.PointLight | null = null
  if (options.castLight !== false) {
    light = new THREE.PointLight(color, intensity * 0.5, options.lightDistance ?? 6, 1.6)
    light.position.set(0, -0.4, 0)
    group.add(light)
  }

  if (options.registerTick && options.periodSeconds) {
    const phase = createPhotoperiod({
      periodSeconds: options.periodSeconds,
      onFraction: options.onFraction,
      fadeFraction: options.fadeFraction,
    })
    options.registerTick((_delta, elapsed) => {
      const level = phase(elapsed)
      barMaterial.emissiveIntensity = intensity * level
      diffuserMaterial.emissiveIntensity = intensity * 0.7 * level
      if (light) light.intensity = intensity * 0.5 * level
    })
  }

  return group
}
