import * as THREE from 'three'
import type { WorldTickFn, UnregisterTick } from '../../core/types'
import { createRng } from '../../engine/random'

export interface WorkbenchOptions {
  width?: number
  depth?: number
  height?: number
  trays?: number
  trayGrowth?: number
  console?: boolean
  registerTick?: (fn: WorldTickFn) => UnregisterTick
}

export function createWorkbench(options: WorkbenchOptions = {}): THREE.Group {
  const width = options.width ?? 3
  const depth = options.depth ?? 0.9
  const height = options.height ?? 0.9
  const trays = Math.max(0, options.trays ?? 2)
  const trayGrowth = Math.min(1, Math.max(0, options.trayGrowth ?? 0.2))

  const group = new THREE.Group()

  const frameMaterial = new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.5, roughness: 0.45 })
  const legGeometry = new THREE.BoxGeometry(0.07, height, 0.07)
  const legAnchors: [number, number][] = [
    [-width / 2 + 0.08, depth / 2 - 0.08],
    [width / 2 - 0.08, depth / 2 - 0.08],
    [-width / 2 + 0.08, -depth / 2 + 0.08],
    [width / 2 - 0.08, -depth / 2 + 0.08],
  ]
  for (const [x, z] of legAnchors) {
    const leg = new THREE.Mesh(legGeometry, frameMaterial)
    leg.position.set(x, height / 2, z)
    group.add(leg)
  }

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.06, depth),
    new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.15, roughness: 0.65 }),
  )
  top.position.y = height + 0.03
  top.castShadow = true
  group.add(top)

  const rng = createRng(83)
  const trayWidth = (width - 0.4) / Math.max(1, trays) - 0.15
  for (let i = 0; i < trays; i += 1) {
    const tray = new THREE.Mesh(
      new THREE.BoxGeometry(trayWidth, 0.09, depth - 0.25),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.7 }),
    )
    const x = -width / 2 + 0.3 + (i + 0.5) * ((width - 0.6) / Math.max(1, trays))
    tray.position.set(x, height + 0.1, 0)
    group.add(tray)

    const cells = Math.max(3, Math.floor(trayWidth / 0.16))
    const seedlings = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.035, 0.09, 5),
      new THREE.MeshStandardMaterial({ color: '#86efac', roughness: 0.7 }),
      cells * 2,
    )
    const dummy = new THREE.Object3D()
    let index = 0
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < cells; col += 1) {
        const local = Math.min(1, Math.max(0.1, trayGrowth + (rng() - 0.5) * 0.15))
        dummy.position.set(
          x - trayWidth / 2 + 0.1 + (col / Math.max(1, cells - 1)) * (trayWidth - 0.2),
          height + 0.14 + local * 0.04,
          -((depth - 0.35) / 4) + row * ((depth - 0.35) / 2),
        )
        dummy.scale.setScalar(0.6 + local * 0.7)
        dummy.rotation.set(0, rng() * Math.PI, 0)
        dummy.updateMatrix()
        seedlings.setMatrixAt(index, dummy.matrix)
        index += 1
      }
    }
    group.add(seedlings)
  }

  if (options.console !== false) {
    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1.15, 0.4),
      new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.4, roughness: 0.55 }),
    )
    pedestal.position.set(width / 2 + 0.45, 0.575, 0)
    group.add(pedestal)

    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.36, 0.04),
      new THREE.MeshStandardMaterial({
        color: '#0f172a',
        emissive: new THREE.Color('#22d3ee'),
        emissiveIntensity: 0.9,
        roughness: 0.3,
      }),
    )
    screen.position.set(width / 2 + 0.45, 1.22, 0)
    screen.rotation.x = -0.28
    group.add(screen)

    const status = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 6),
      new THREE.MeshStandardMaterial({
        color: '#22c55e',
        emissive: new THREE.Color('#22c55e'),
        emissiveIntensity: 1.6,
      }),
    )
    status.position.set(width / 2 + 0.45, 1.42, 0.08)
    group.add(status)

    if (options.registerTick) {
      const statusMaterial = status.material as THREE.MeshStandardMaterial
      options.registerTick((_delta, elapsed) => {
        statusMaterial.emissiveIntensity = 1.1 + Math.sin(elapsed * 2.4) * 0.7
      })
    }
  }

  return group
}
