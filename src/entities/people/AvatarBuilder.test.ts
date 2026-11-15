import { describe, it, expect, vi } from 'vitest'
import * as THREE from 'three'
import { createStylizedAvatar } from './AvatarBuilder'
import { MaterialPalette } from '../../engine/materials'
import type { WorldEntity } from '../../core/types'

// GLB assets cannot be fetched in the Node test environment — resolve to null so
// the placeholder geometry path is exercised instead.
vi.mock('../../engine/modelLoader', () => ({
  ModelLoader: {
    getInstance: () => ({
      load: async () => null,
    }),
  },
}))

const baseEntity: WorldEntity = {
  id: 'test-1',
  type: 'person',
  name: 'Test worker',
  position: [0, 0, 0],
  status: 'idle',
  pinNumber: 1,
}

function findStatusHalo(group: THREE.Group): THREE.Mesh {
  let halo: THREE.Mesh | null = null
  group.traverse((obj) => {
    if (!halo && obj instanceof THREE.Mesh && (obj.geometry as THREE.BufferGeometry).type === 'RingGeometry') {
      halo = obj
    }
  })
  if (!halo) throw new Error('Status halo mesh not found on avatar')
  return halo
}

describe('createStylizedAvatar hot-sync', () => {
  it('updates the status halo color without rebuilding the avatar', () => {
    const materials = new MaterialPalette()
    const { group, update } = createStylizedAvatar(baseEntity, materials)

    const halo = findStatusHalo(group)
    const before = halo.material as THREE.MeshBasicMaterial
    expect(before.color.getHex()).toBe(0x22c55e) // idle = green

    update({ ...baseEntity, status: 'running' })
    const after = halo.material as THREE.MeshBasicMaterial
    expect(after.color.getHex()).toBe(0x3b82f6) // running = blue

    update({ ...baseEntity, status: 'awaiting_approval' })
    const awaiting = halo.material as THREE.MeshBasicMaterial
    expect(awaiting.color.getHex()).toBe(0xf59e0b) // awaiting = amber
  })

  it('updates the avatar transform in place', () => {
    const materials = new MaterialPalette()
    const { group, update } = createStylizedAvatar(baseEntity, materials)

    update({ ...baseEntity, position: [5, 0, -3], rotation: [0, Math.PI / 2, 0] })

    expect(group.position.x).toBe(5)
    expect(group.position.z).toBe(-3)
    expect(group.rotation.y).toBeCloseTo(Math.PI / 2)
  })

  it('is a no-op material-wise when the status does not change', () => {
    const materials = new MaterialPalette()
    const { group, update } = createStylizedAvatar(baseEntity, materials)

    const halo = findStatusHalo(group)
    const materialBefore = halo.material
    update({ ...baseEntity, status: 'idle' })
    expect(halo.material).toBe(materialBefore)
  })
})
