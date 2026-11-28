import * as THREE from 'three'
import type { WorldTickFn, UnregisterTick } from '../../core/types'

export interface ClimateUnitOptions {
  width?: number
  height?: number
  depth?: number
  bodyColor?: string
  fanSpeed?: number
  airflow?: boolean
  registerTick?: (fn: WorldTickFn) => UnregisterTick
}

export function createClimateUnit(options: ClimateUnitOptions = {}): THREE.Group {
  const width = options.width ?? 1.4
  const height = options.height ?? 0.6
  const depth = options.depth ?? 1
  const fanSpeed = options.fanSpeed ?? 5

  const group = new THREE.Group()

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({
      color: options.bodyColor ?? '#cbd5e1',
      metalness: 0.5,
      roughness: 0.45,
    }),
  )
  body.position.y = height / 2
  body.castShadow = true
  group.add(body)

  const grille = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.9, 0.04, depth * 0.9),
    new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.3, roughness: 0.7 }),
  )
  grille.position.y = height
  group.add(grille)

  const fanRadius = Math.min(width, depth) * 0.32
  const vent = new THREE.Mesh(
    new THREE.TorusGeometry(fanRadius, fanRadius * 0.14, 8, 20),
    new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.6, roughness: 0.4 }),
  )
  vent.rotation.x = Math.PI / 2
  vent.position.set(0, height + 0.03, 0)
  group.add(vent)

  const fan = new THREE.Group()
  fan.position.set(0, height + 0.03, 0)
  const bladeGeometry = new THREE.BoxGeometry(fanRadius * 0.9, 0.02, fanRadius * 0.3)
  const bladeMaterial = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.2, roughness: 0.6 })
  for (let i = 0; i < 4; i += 1) {
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial)
    blade.rotation.y = (i / 4) * Math.PI * 2
    blade.position.set(
      Math.cos((i / 4) * Math.PI * 2) * fanRadius * 0.45,
      0,
      Math.sin((i / 4) * Math.PI * 2) * fanRadius * 0.45,
    )
    fan.add(blade)
  }
  group.add(fan)

  if (options.airflow !== false) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(fanRadius * 1.15, 2.4, 16, 1, true),
      new THREE.MeshStandardMaterial({
        color: '#bae6fd',
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    cone.rotation.x = Math.PI
    cone.position.set(0, height - 1.2, 0)
    group.add(cone)
  }

  if (options.registerTick) {
    options.registerTick((_delta, elapsed) => {
      fan.rotation.y = elapsed * fanSpeed
    })
  }

  return group
}
