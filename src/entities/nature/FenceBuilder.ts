import * as THREE from 'three'

/**
 * Ranch fence along a polyline — posts at every point (subdivided so gaps
 * never exceed `maxPostGap`) plus two horizontal rails per segment.
 */

export interface FenceOptions {
  /** Corner points of the fence path, in world space (y is ignored). */
  points: Array<[number, number, number]>
  height?: number
  postColor?: string
  railColor?: string
  /** Maximum spacing between posts before a span is subdivided. */
  maxPostGap?: number
  /** `picket` runs rails between every post pair; `ranch` spans full corners. */
  style?: 'ranch' | 'picket'
}

interface FencePoint {
  x: number
  z: number
}

export function fencePostsFor(points: FencePoint[], maxPostGap: number): FencePoint[] {
  const posts: FencePoint[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    if (!a || !b) continue
    const dx = b.x - a.x
    const dz = b.z - a.z
    const len = Math.hypot(dx, dz)
    const segments = Math.max(1, Math.ceil(len / maxPostGap))
    for (let s = 0; s < segments; s++) {
      posts.push({ x: a.x + (dx * s) / segments, z: a.z + (dz * s) / segments })
    }
  }
  const last = points[points.length - 1]
  if (last) {
    posts.push(last)
  }
  return posts
}

export function createFence(options: FenceOptions): THREE.Group {
  const {
    points,
    height = 1.05,
    postColor = '#8a6a45',
    railColor = '#9c7b52',
    maxPostGap = 2.4,
    style = 'ranch',
  } = options

  const group = new THREE.Group()
  group.name = 'fence'
  if (points.length < 2) return group

  const flat: FencePoint[] = points.map(([x, , z]) => ({ x, z }))
  const posts = fencePostsFor(flat, maxPostGap)

  const postMat = new THREE.MeshStandardMaterial({ color: postColor, roughness: 0.92 })
  const railMat = new THREE.MeshStandardMaterial({ color: railColor, roughness: 0.92 })

  const postGeo = new THREE.BoxGeometry(0.1, height, 0.1)
  for (const p of posts) {
    const post = new THREE.Mesh(postGeo, postMat)
    post.position.set(p.x, height / 2, p.z)
    post.castShadow = true
    group.add(post)
  }

  // Picket fences follow every post pair (tight, garden feel); ranch fences
  // stretch single rails across each full corner-to-corner span.
  const spans: Array<{ from: FencePoint; to: FencePoint }> = []
  if (style === 'picket') {
    for (let i = 0; i < posts.length - 1; i++) {
      const from = posts[i]
      const to = posts[i + 1]
      if (from && to) spans.push({ from, to })
    }
  } else {
    for (let i = 0; i < flat.length - 1; i++) {
      const from = flat[i]
      const to = flat[i + 1]
      if (from && to) spans.push({ from, to })
    }
  }

  for (const { from, to } of spans) {
    const dx = to.x - from.x
    const dz = to.z - from.z
    const len = Math.hypot(dx, dz)
    if (len < 0.01) continue
    const angle = Math.atan2(dx, dz)

    for (const railY of [height * 0.42, height * 0.82] as const) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, len * 1.02), railMat)
      rail.position.set((from.x + to.x) / 2, railY, (from.z + to.z) / 2)
      rail.rotation.y = angle
      rail.castShadow = true
      group.add(rail)
    }
  }

  return group
}
