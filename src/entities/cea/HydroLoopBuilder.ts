import * as THREE from 'three'
import type { Vector3Tuple, WorldTickFn, UnregisterTick } from '../../core/types'

export interface HydroLoopOptions {
  points: Vector3Tuple[]
  closed?: boolean
  radius?: number
  pipeColor?: string
  pipeOpacity?: number
  flowSpeed?: number
  dashCount?: number
  dashColor?: string
  dashSize?: number
  registerTick?: (fn: WorldTickFn) => UnregisterTick
}

export function createHydroLoop(options: HydroLoopOptions): THREE.Group {
  if (options.points.length < 2) {
    throw new Error('Hydro loop needs at least two points')
  }

  const radius = options.radius ?? 0.07
  const flowSpeed = options.flowSpeed ?? 0.08
  const dashCount = Math.max(2, options.dashCount ?? 14)

  const group = new THREE.Group()

  const curve = new THREE.CatmullRomCurve3(
    options.points.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    options.closed !== false,
    'catmullrom',
    0.4,
  )

  const pipe = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 96, radius, 10, options.closed !== false),
    new THREE.MeshStandardMaterial({
      color: options.pipeColor ?? '#7dd3fc',
      transparent: true,
      opacity: options.pipeOpacity ?? 0.34,
      roughness: 0.15,
      metalness: 0.1,
    }),
  )
  group.add(pipe)

  const dashGeometry = new THREE.SphereGeometry(options.dashSize ?? radius * 0.72, 8, 6)
  const dashes = new THREE.InstancedMesh(
    dashGeometry,
    new THREE.MeshStandardMaterial({
      color: options.dashColor ?? '#38bdf8',
      emissive: new THREE.Color(options.dashColor ?? '#38bdf8'),
      emissiveIntensity: 1.4,
      roughness: 0.3,
    }),
    dashCount,
  )
  group.add(dashes)

  if (options.registerTick) {
    const dummy = new THREE.Object3D()
    options.registerTick((_delta, elapsed) => {
      for (let i = 0; i < dashCount; i += 1) {
        const t = ((elapsed * flowSpeed + i / dashCount) % 1 + 1) % 1
        const point = curve.getPointAt(t)
        const tangent = curve.getTangentAt(t)
        dummy.position.copy(point)
        dummy.lookAt(point.clone().add(tangent))
        dummy.scale.set(0.7, 0.7, 1.6)
        dummy.updateMatrix()
        dashes.setMatrixAt(i, dummy.matrix)
      }
      dashes.instanceMatrix.needsUpdate = true
    })
  } else {
    const dummy = new THREE.Object3D()
    for (let i = 0; i < dashCount; i += 1) {
      dummy.position.copy(curve.getPointAt(i / dashCount))
      dummy.scale.set(0.7, 0.7, 1.6)
      dummy.updateMatrix()
      dashes.setMatrixAt(i, dummy.matrix)
    }
    dashes.instanceMatrix.needsUpdate = true
  }

  return group
}
