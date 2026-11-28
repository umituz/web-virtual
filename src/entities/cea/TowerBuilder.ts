import * as THREE from 'three'
import type { WorldTickFn, UnregisterTick } from '../../core/types'
import { createRng } from '../../engine/random'
import { createMistField } from '../../engine/particles'

export interface VerticalTowerOptions {
  height?: number
  pocketRows?: number
  pocketsPerRow?: number
  growth?: number
  plantColor?: string
  mist?: boolean
  registerTick?: (fn: WorldTickFn) => UnregisterTick
}

export function createVerticalTower(options: VerticalTowerOptions = {}): THREE.Group {
  const height = options.height ?? 2.6
  const pocketRows = Math.max(1, options.pocketRows ?? 6)
  const pocketsPerRow = Math.max(2, options.pocketsPerRow ?? 4)
  const growth = Math.min(1, Math.max(0, options.growth ?? 0.6))
  const plantColor = options.plantColor ?? '#4ade80'

  const group = new THREE.Group()

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.11, height, 10),
    new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.5, roughness: 0.4 }),
  )
  pole.position.y = height / 2
  pole.castShadow = true
  group.add(pole)

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.4, 0.1, 12),
    new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.4, roughness: 0.6 }),
  )
  base.position.y = 0.05
  group.add(base)

  const pocketGeometry = new THREE.CylinderGeometry(0.09, 0.07, 0.24, 8)
  const pocketMaterial = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.8 })
  const canopyGeometry = new THREE.SphereGeometry(0.1, 6, 5)
  const canopyMaterial = new THREE.MeshStandardMaterial({ color: plantColor, roughness: 0.65 })
  const totalCount = pocketRows * pocketsPerRow
  const pockets = new THREE.InstancedMesh(pocketGeometry, pocketMaterial, totalCount)
  const canopies = new THREE.InstancedMesh(canopyGeometry, canopyMaterial, totalCount)
  canopies.castShadow = true

  const rng = createRng(19)
  const dummy = new THREE.Object3D()
  let index = 0
  for (let row = 0; row < pocketRows; row += 1) {
    const y = 0.35 + (row / Math.max(1, pocketRows - 1)) * (height - 0.6)
    const rowAngle = (row % 2) * (Math.PI / pocketsPerRow)
    for (let slot = 0; slot < pocketsPerRow; slot += 1) {
      const angle = rowAngle + (slot / pocketsPerRow) * Math.PI * 2
      const radius = 0.24
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius

      dummy.position.set(x, y, z)
      dummy.rotation.set(Math.PI / 2.6, -angle, 0)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      pockets.setMatrixAt(index, dummy.matrix)

      const localGrowth = Math.min(1, Math.max(0.08, growth + (rng() - 0.5) * 0.2))
      dummy.position.set(x * 1.7, y + 0.1, z * 1.7)
      dummy.rotation.set(0, rng() * Math.PI, 0)
      dummy.scale.setScalar(0.4 + localGrowth * 0.95)
      dummy.updateMatrix()
      canopies.setMatrixAt(index, dummy.matrix)

      index += 1
    }
  }
  group.add(pockets)
  group.add(canopies)

  if (options.mist) {
    const mist = createMistField({
      width: 0.9,
      depth: 0.9,
      baseHeight: height * 0.75,
      riseHeight: height * 0.35,
      count: 45,
      color: '#e0f2fe',
      opacity: 0.26,
      size: 0.09,
      speed: 0.5,
      registerTick: options.registerTick,
    })
    group.add(mist)
  }

  return group
}
