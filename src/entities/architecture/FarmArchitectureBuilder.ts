import * as THREE from 'three'
import type { Vector3Tuple } from '../../core/types'

/**
 * Procedural farm architecture — barn, silo, greenhouse, machine shed,
 * chicken coop and farmhouse. Every piece is optional and parameterized:
 * consumers compose exactly the yard their data calls for. All geometry is
 * primitive-based (no asset loading) so worlds build instantly.
 */

export interface BarnOptions {
  width?: number
  depth?: number
  height?: number
  wallColor?: string
  roofColor?: string
  frameColor?: string
  position?: Vector3Tuple
  rotationY?: number
  entityId?: string
}

export function createBarn(options: BarnOptions = {}): THREE.Group {
  const {
    width = 10,
    depth = 7,
    height = 3.4,
    wallColor = '#9d3b2c',
    roofColor = '#3f2f26',
    frameColor = '#f3e7d3',
    position = [0, 0, 0],
    rotationY = 0,
    entityId,
  } = options

  const group = new THREE.Group()
  group.name = 'barn'
  group.position.set(position[0], position[1], position[2])
  group.rotation.y = rotationY
  if (entityId) group.userData = { entityId }

  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.9 })
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.85 })
  const frameMat = new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.9 })

  // Walls
  const walls = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat)
  walls.position.y = height / 2
  walls.castShadow = true
  walls.receiveShadow = true
  group.add(walls)

  // Gable roof — two slabs meeting at a ridge along x
  const roofSlope = Math.hypot(depth / 2, height * 0.45)
  for (const side of [-1, 1]) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(width * 1.04, 0.16, roofSlope), roofMat)
    slab.position.set(0, height + height * 0.22, (side * depth) / 4)
    slab.rotation.x = side * Math.atan2(height * 0.45, depth / 2)
    slab.castShadow = true
    group.add(slab)
  }
  // Gable triangles
  const gableShape = new THREE.Shape()
  gableShape.moveTo(-depth / 2, 0)
  gableShape.lineTo(depth / 2, 0)
  gableShape.lineTo(0, height * 0.45)
  gableShape.closePath()
  const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: 0.12, bevelEnabled: false })
  for (const side of [-1, 1]) {
    const gable = new THREE.Mesh(gableGeo, wallMat)
    gable.position.set((side * width) / 2, height, 0.06)
    gable.rotation.y = (side * Math.PI) / 2
    group.add(gable)
  }

  // Big center door with white trim
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(width * 0.4, height * 0.72, 0.06), frameMat)
  doorFrame.position.set(0, (height * 0.72) / 2, depth / 2)
  group.add(doorFrame)
  const door = new THREE.Mesh(new THREE.BoxGeometry(width * 0.34, height * 0.66, 0.1), roofMat)
  door.position.set(0, (height * 0.66) / 2, depth / 2 + 0.05)
  group.add(door)

  // Hayloft window
  const loft = new THREE.Mesh(new THREE.BoxGeometry(width * 0.16, height * 0.18, 0.06), frameMat)
  loft.position.set(0, height * 0.8, depth / 2 + 0.03)
  group.add(loft)

  return group
}

export interface SiloOptions {
  radius?: number
  height?: number
  color?: string
  capColor?: string
  position?: Vector3Tuple
  entityId?: string
}

export function createSilo(options: SiloOptions = {}): THREE.Group {
  const {
    radius = 1.5,
    height = 6,
    color = '#cfd8dc',
    capColor = '#8d99a4',
    position = [0, 0, 0],
    entityId,
  } = options

  const group = new THREE.Group()
  group.name = 'silo'
  group.position.set(position[0], position[1], position[2])
  if (entityId) group.userData = { entityId }

  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.35 })
  const capMat = new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.6, metalness: 0.3 })

  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 14), bodyMat)
  body.position.y = height / 2
  body.castShadow = true
  group.add(body)

  const cap = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), capMat)
  cap.position.y = height
  cap.castShadow = true
  group.add(cap)

  return group
}

export interface GreenhouseOptions {
  width?: number
  depth?: number
  height?: number
  frameColor?: string
  glassColor?: string
  glassOpacity?: number
  position?: Vector3Tuple
  rotationY?: number
  /** Interior planting benches — plain crop-color strips. */
  benches?: Array<{ color?: string; growth?: number }>
  entityId?: string
}

export function createGreenhouse(options: GreenhouseOptions = {}): THREE.Group {
  const {
    width = 9,
    depth = 6,
    // `height` is accepted for API symmetry — the vault derives from depth.
    height: _height = 2.8,
    frameColor = '#e8eaed',
    glassColor = '#cdebdd',
    glassOpacity = 0.3,
    position = [0, 0, 0],
    rotationY = 0,
    benches,
    entityId,
  } = options
  void _height

  const group = new THREE.Group()
  group.name = 'greenhouse'
  group.position.set(position[0], position[1], position[2])
  group.rotation.y = rotationY
  if (entityId) group.userData = { entityId }

  const frameMat = new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.6, metalness: 0.3 })
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: glassColor,
    transparent: true,
    opacity: glassOpacity,
    roughness: 0.08,
    metalness: 0.1,
  })

  // Glass shell — barrel vault made of a half-cylinder along x
  const vault = new THREE.Mesh(
    new THREE.CylinderGeometry(depth / 2, depth / 2, width, 18, 1, false, 0, Math.PI),
    glassMat,
  )
  vault.rotation.z = Math.PI / 2
  vault.position.y = 0.02
  vault.castShadow = false
  group.add(vault)

  // End walls
  for (const side of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.CircleGeometry(depth / 2, 18, 0, Math.PI), glassMat)
    cap.position.set((side * width) / 2, 0, 0)
    cap.rotation.y = (side * Math.PI) / 2
    group.add(cap)
  }

  // Structural ribs
  const ribs = Math.max(3, Math.round(width / 2.2))
  for (let i = 0; i <= ribs; i++) {
    const rib = new THREE.Mesh(
      new THREE.TorusGeometry(depth / 2 - 0.03, 0.035, 6, 18, Math.PI),
      frameMat,
    )
    rib.position.set(-width / 2 + (i * width) / ribs, 0, 0)
    rib.rotation.y = Math.PI / 2
    group.add(rib)
  }
  const ridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, width, 6),
    frameMat,
  )
  ridge.rotation.z = Math.PI / 2
  ridge.position.y = depth / 2
  group.add(ridge)

  // Planting benches with crop strips
  if (benches && benches.length > 0) {
    const benchW = (depth * 0.72) / benches.length
    benches.forEach((bench, i) => {
      const z = -depth * 0.36 + benchW * (i + 0.5)
      const table = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.88, 0.1, benchW * 0.86),
        frameMat,
      )
      table.position.set(0, 0.5, z)
      group.add(table)

      if ((bench.growth ?? 0.5) > 0.05) {
        const g = THREE.MathUtils.clamp(bench.growth ?? 0.5, 0, 1)
        const crop = new THREE.Mesh(
          new THREE.BoxGeometry(width * 0.84, 0.08 + g * 0.4, benchW * 0.7),
          new THREE.MeshStandardMaterial({ color: bench.color ?? '#4d7c0f', roughness: 0.9 }),
        )
        crop.position.set(0, 0.56 + (g * 0.4) / 2, z)
        group.add(crop)
      }
    })
  }

  return group
}

export interface MachineShedOptions {
  width?: number
  depth?: number
  height?: number
  color?: string
  roofColor?: string
  position?: Vector3Tuple
  rotationY?: number
  entityId?: string
}

/** Open-front machinery shed — three walls, roof, no front wall. */
export function createMachineShed(options: MachineShedOptions = {}): THREE.Group {
  const {
    width = 9,
    depth = 6,
    height = 3,
    color = '#5d6b74',
    roofColor = '#39434a',
    position = [0, 0, 0],
    rotationY = 0,
    entityId,
  } = options

  const group = new THREE.Group()
  group.name = 'machine-shed'
  group.position.set(position[0], position[1], position[2])
  group.rotation.y = rotationY
  if (entityId) group.userData = { entityId }

  const wallMat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 })
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.8 })

  const t = 0.14
  // Back + side walls
  const back = new THREE.Mesh(new THREE.BoxGeometry(width, height, t), wallMat)
  back.position.set(0, height / 2, -depth / 2)
  back.castShadow = true
  group.add(back)
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(t, height, depth), wallMat)
    wall.position.set((side * width) / 2, height / 2, 0)
    wall.castShadow = true
    group.add(wall)
  }
  // Flat shallow-pitch roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 1.08, 0.16, depth * 1.08), roofMat)
  roof.position.y = height + 0.08
  roof.rotation.x = 0.06
  roof.castShadow = true
  group.add(roof)

  return group
}

export interface CoopOptions {
  position?: Vector3Tuple
  rotationY?: number
  color?: string
  roofColor?: string
  scale?: number
  entityId?: string
}

/** Small chicken coop — raised house with a ramp and a fenced run. */
export function createCoop(options: CoopOptions = {}): THREE.Group {
  const {
    position = [0, 0, 0],
    rotationY = 0,
    color = '#a97c50',
    roofColor = '#6d5843',
    scale = 1,
    entityId,
  } = options

  const group = new THREE.Group()
  group.name = 'coop'
  group.position.set(position[0], position[1], position[2])
  group.rotation.y = rotationY
  if (entityId) group.userData = { entityId }

  const woodMat = new THREE.MeshStandardMaterial({ color, roughness: 0.92 })
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.85 })
  const wireMat = new THREE.MeshStandardMaterial({
    color: '#9aa38f',
    roughness: 0.7,
    wireframe: true,
    transparent: true,
    opacity: 0.5,
  })

  // Raised house
  const house = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.2), woodMat)
  house.position.y = 0.75
  house.castShadow = true
  group.add(house)

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.12, 1.4), roofMat)
  roof.position.y = 1.32
  roof.rotation.z = 0.12
  group.add(roof)

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.4, 0.06), roofMat)
  door.position.set(0, 0.72, 0.62)
  group.add(door)

  // Legs
  for (const [lx, lz] of [
    [-0.65, -0.45],
    [0.65, -0.45],
    [-0.65, 0.45],
    [0.65, 0.45],
  ] as const) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.5, 0.09), woodMat)
    leg.position.set(lx, 0.25, lz)
    group.add(leg)
  }

  // Ramp
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 1.0), woodMat)
  ramp.position.set(0, 0.38, 1.05)
  ramp.rotation.x = -0.5
  group.add(ramp)

  // Fenced run
  const run = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 2.4), wireMat)
  run.position.set(0, 0.5, 2.1)
  group.add(run)

  group.scale.setScalar(scale)
  return group
}
