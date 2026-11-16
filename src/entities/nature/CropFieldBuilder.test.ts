import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { createCropPlot } from './CropFieldBuilder'
import { createTree, createTreeRow } from './TreeBuilder'
import { fencePostsFor, createFence } from './FenceBuilder'

function findInstancedPlants(group: THREE.Group): THREE.InstancedMesh | null {
  let found: THREE.InstancedMesh | null = null
  group.traverse((obj) => {
    if (!found && obj instanceof THREE.InstancedMesh) found = obj
  })
  return found
}

describe('createCropPlot', () => {
  it('scales plant count and height with growth', () => {
    const young = findInstancedPlants(createCropPlot({ growth: 0.1, rows: 6 }))!
    const mature = findInstancedPlants(createCropPlot({ growth: 1, rows: 6 }))!

    expect(young.count).toBeGreaterThan(0)
    expect(mature.count).toBeGreaterThan(young.count)

    const matrix = new THREE.Matrix4()
    young.getMatrixAt(0, matrix)
    const youngScale = new THREE.Vector3().setFromMatrixScale(matrix)
    mature.getMatrixAt(0, matrix)
    const matureScale = new THREE.Vector3().setFromMatrixScale(matrix)
    expect(matureScale.y).toBeGreaterThan(youngScale.y)
  })

  it('is deterministic for the same seed', () => {
    const a = findInstancedPlants(createCropPlot({ seed: 42 }))!
    const b = findInstancedPlants(createCropPlot({ seed: 42 }))!
    const c = findInstancedPlants(createCropPlot({ seed: 43 }))!

    const ma = new THREE.Matrix4()
    const mb = new THREE.Matrix4()
    const mc = new THREE.Matrix4()
    for (let i = 0; i < a.count; i++) {
      a.getMatrixAt(i, ma)
      b.getMatrixAt(i, mb)
      c.getMatrixAt(i, mc)
      expect(ma.equals(mb)).toBe(true)
    }
    expect(ma.equals(mc)).toBe(false)
  })

  it('places every plant on top of the soil bed', () => {
    const plot = createCropPlot({ growth: 0.8 })
    const plants = findInstancedPlants(plot)!
    const matrix = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    for (let i = 0; i < plants.count; i++) {
      plants.getMatrixAt(i, matrix)
      pos.setFromMatrixPosition(matrix)
      expect(pos.y).toBeGreaterThanOrEqual(0.2) // soilHeight default
    }
  })
})

describe('createTree / createTreeRow', () => {
  it('drops foliage in winter', () => {
    const summer = createTree({ season: 'summer' })
    const winter = createTree({ season: 'winter' })
    const hasFoliage = (tree: THREE.Group) =>
      tree.getObjectByName('tree-foliage') !== undefined
    expect(hasFoliage(summer)).toBe(true)
    expect(hasFoliage(winter)).toBe(false)
  })

  it('builds a row with the requested number of trees', () => {
    const row = createTreeRow({ count: 7, spacing: 2, axis: 'x' })
    const trees = row.children.filter((c) => c.name === 'tree')
    expect(trees).toHaveLength(7)
    const xs = trees.map((t) => t.position.x).sort((a, b) => a - b)
    expect(xs[0]).toBeCloseTo(-6)
    expect(xs[xs.length - 1]).toBeCloseTo(6)
  })
})

describe('fencePostsFor / createFence', () => {
  it('subdivides long spans so no gap exceeds maxPostGap', () => {
    const posts = fencePostsFor(
      [
        { x: 0, z: 0 },
        { x: 10, z: 0 },
      ],
      2.4,
    )
    expect(posts.length).toBeGreaterThanOrEqual(5) // 10 / 2.4 → 5 segments
    for (let i = 1; i < posts.length; i++) {
      const prev = posts[i - 1]
      const curr = posts[i]
      if (!prev || !curr) throw new Error('missing post')
      const gap = Math.hypot(curr.x - prev.x, curr.z - prev.z)
      expect(gap).toBeLessThanOrEqual(2.4 + 1e-9)
    }
  })

  it('subdivides with exact post at both endpoints', () => {
    const posts = fencePostsFor(
      [
        { x: 0, z: 0 },
        { x: 4.8, z: 0 },
      ],
      2.4,
    )
    const first = posts[0]
    const last = posts[posts.length - 1]
    if (!first || !last) throw new Error('missing endpoints')
    expect(first).toEqual({ x: 0, z: 0 })
    expect(last).toEqual({ x: 4.8, z: 0 })
  })

  it('returns an empty group for degenerate paths', () => {
    const fence = createFence({ points: [[0, 0, 0]] })
    expect(fence.children).toHaveLength(0)
  })
})
