import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { rebindSkinnedSkeletons } from './modelLoader'

/**
 * Synthetic rigged asset: a Group with named bones and a SkinnedMesh bound
 * to them — the same structure Kenney character GLBs produce.
 */
function makeRiggedGroup(): { root: THREE.Group; mesh: THREE.SkinnedMesh; skeleton: THREE.Skeleton } {
  const root = new THREE.Group()
  root.name = 'character'

  const boneRoot = new THREE.Bone()
  boneRoot.name = 'root'
  const boneHead = new THREE.Bone()
  boneHead.name = 'head'
  boneRoot.add(boneHead)
  root.add(boneRoot)

  const mesh = new THREE.SkinnedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial(),
  )
  mesh.name = 'body-mesh'
  root.add(mesh)

  const skeleton = new THREE.Skeleton([boneRoot, boneHead])
  mesh.bind(skeleton, new THREE.Matrix4())

  return { root, mesh, skeleton }
}

describe('rebindSkinnedSkeletons', () => {
  it('leaves non-skinned hierarchies untouched', () => {
    const group = new THREE.Group()
    group.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()))
    const clone = group.clone(true)
    expect(() => rebindSkinnedSkeletons(clone)).not.toThrow()
    expect(clone.children).toHaveLength(1)
  })

  it('clones share the source skeleton before rebinding (the bug)', () => {
    const { root, mesh, skeleton } = makeRiggedGroup()
    const clone = root.clone(true)
    const cloneMesh = clone.getObjectByName('body-mesh') as THREE.SkinnedMesh
    expect(cloneMesh.skeleton).toBe(skeleton)
    expect(cloneMesh.skeleton.bones[0]).toBe(mesh.skeleton.bones[0])
  })

  it('rebinds a cloned skinned mesh to the bones inside its own hierarchy', () => {
    const { root, skeleton } = makeRiggedGroup()
    const clone = root.clone(true)
    rebindSkinnedSkeletons(clone)

    const cloneMesh = clone.getObjectByName('body-mesh') as THREE.SkinnedMesh
    expect(cloneMesh.skeleton).not.toBe(skeleton)
    expect(cloneMesh.skeleton.bones.map((b) => b.name)).toEqual(['root', 'head'])
    for (const bone of cloneMesh.skeleton.bones) {
      // every bound bone must live inside the clone, not the source
      let cur: THREE.Object3D | null = bone
      while (cur) {
        if (cur === clone) break
        cur = cur.parent
      }
      expect(cur).toBe(clone)
    }
  })

  it('keeps the original bound when a joint is missing from the clone', () => {
    const { root, skeleton } = makeRiggedGroup()
    const clone = root.clone(true)
    // rename a cloned bone so the joint cannot be resolved by name
    clone.getObjectByName('head')!.name = 'renamed'
    rebindSkinnedSkeletons(clone)

    const cloneMesh = clone.getObjectByName('body-mesh') as THREE.SkinnedMesh
    expect(cloneMesh.skeleton).toBe(skeleton)
  })
})
