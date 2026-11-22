import * as THREE from 'three'
import type { MaterialPalette } from '../../engine/materials'
import { ModelLoader } from '../../engine/modelLoader'
import type { RoomRect, ResidencePlan } from '../../presets/residencePreset'
import { ROOM_STYLES } from '../../presets/residencePreset'

export interface ResidenceBuildOptions {
  plan: ResidencePlan
  nightMode?: boolean
}

const DOOR_GAP = 0.9
const EXT_WALL = 0.2
const INT_WALL = 0.12
const PIER = 0.3
const WINDOW_SILL = 0.9
const WINDOW_HEAD = 2.1
const RAIL_HEIGHT = 1.05

export function buildResidenceArchitecture(
  materials: MaterialPalette,
  options: ResidenceBuildOptions,
): THREE.Group {
  const root = new THREE.Group()
  root.name = 'residence-architecture'

  const { plan } = options
  const W = plan.footprint.w
  const D = plan.footprint.d
  const H = plan.wallHeight
  const halfW = W / 2
  const halfD = D / 2

  const wallMat = materials.getWallMaterial('#f1f5f9')
  const frameMat = materials.getFrameMaterial('#1e293b')
  const glassMat = materials.getGlassMaterial('#bae6fd', 0.22)
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.9 })

  const groundMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.96 })
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.015
  ground.receiveShadow = true
  root.add(ground)
  const grid = new THREE.GridHelper(60, 30, 0xe2e8f0, 0xf1f5f9)
  grid.position.y = -0.01
  root.add(grid)

  let slabIndex = 0
  for (const room of plan.rooms) {
    const style = ROOM_STYLES[room.kind]
    const mat =
      style.floor === 'wood'
        ? materials.getWoodParquet()
        : style.floor === 'tile'
          ? materials.getTileFloor('#f8fafc')
          : concreteMat
    addSlab(root, mat, room, room.id, slabIndex++)
    for (const extra of room.extras ?? []) {
      addSlab(root, mat, extra, room.id, slabIndex++)
    }
  }

  addWindowWall(root, wallMat, frameMat, glassMat, {
    fromX: -halfW,
    toX: halfW,
    z: halfD,
    height: H,
  })

  addWallWithGaps(root, wallMat, {
    fromX: -halfW,
    toX: halfW,
    z: -halfD,
    height: H,
    thickness: EXT_WALL,
    gaps: [{ cx: plan.entryX, width: DOOR_GAP + 0.15 }],
  })

  const panoramic = plan.orientation.panoramic
  for (const side of [-1, 1]) {
    const x = side * halfW
    if (panoramic) {
      addWindowWall(root, wallMat, frameMat, glassMat, {
        fromZ: -halfD,
        toZ: halfD,
        x,
        height: H,
      })
    } else {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(EXT_WALL, H, D), wallMat)
      seg.position.set(x, H / 2, 0)
      seg.castShadow = true
      seg.receiveShadow = true
      root.add(seg)
    }
  }

  const nightZ1 = plan.layout.nightZ1
  const gaps = plan.layout.nightWallRooms.map((room) => ({
    cx: room.cx,
    width: room.kind === 'hall' ? 1.4 : DOOR_GAP,
  }))
  if (gaps.length === 0) gaps.push({ cx: 0, width: DOOR_GAP })
  addWallWithGaps(root, wallMat, {
    fromX: -halfW + INT_WALL / 2,
    toX: halfW - INT_WALL / 2,
    z: nightZ1,
    height: H,
    thickness: INT_WALL,
    gaps,
  })

  for (const x of plan.layout.nightDividers) {
    const depth = nightZ1 + halfD
    const seg = new THREE.Mesh(new THREE.BoxGeometry(INT_WALL, H, depth), wallMat)
    seg.position.set(x, H / 2, -halfD + depth / 2)
    seg.castShadow = true
    seg.receiveShadow = true
    root.add(seg)
  }

  for (const balcony of plan.rooms.filter((r) => r.kind === 'balcony')) {
    addBalcony(root, concreteMat, frameMat, glassMat, balcony)
  }

  return root
}

export function loadResidenceFurniture(scene: THREE.Scene, plan: ResidencePlan): void {
  const loader = ModelLoader.getInstance()
  for (const anchor of plan.furniture) {
    void loader.load(anchor.asset).then((model) => {
      model.scale.setScalar(anchor.scale)
      model.position.set(anchor.x, anchor.y ?? 0, anchor.z)
      model.rotation.y = anchor.rotY
      scene.add(model)
    })
  }
}

function addSlab(
  root: THREE.Group,
  mat: THREE.Material,
  rect: { cx: number; cz: number; w: number; d: number },
  entityId: string,
  index: number,
): void {
  const slab = new THREE.Mesh(new THREE.PlaneGeometry(rect.w, rect.d), mat)
  slab.rotation.x = -Math.PI / 2
  slab.position.set(rect.cx, 0.002 * (index + 1), rect.cz)
  slab.receiveShadow = true
  slab.userData.entityId = entityId
  root.add(slab)
}

interface WallSpanX {
  fromX: number
  toX: number
  z: number
  height: number
  thickness: number
  gaps: Array<{ cx: number; width: number }>
}

function addWallWithGaps(
  root: THREE.Group,
  mat: THREE.Material,
  span: WallSpanX,
): void {
  const segments: Array<[number, number]> = []
  let cursor = span.fromX
  const sorted = [...span.gaps].sort((a, b) => a.cx - b.cx)
  for (const gap of sorted) {
    const start = gap.cx - gap.width / 2
    const end = gap.cx + gap.width / 2
    if (start > cursor) segments.push([cursor, start])
    cursor = Math.max(cursor, end)
  }
  if (cursor < span.toX) segments.push([cursor, span.toX])

  for (const [x0, x1] of segments) {
    const len = x1 - x0
    if (len <= 0.01) continue
    const seg = new THREE.Mesh(new THREE.BoxGeometry(len, span.height, span.thickness), mat)
    seg.position.set((x0 + x1) / 2, span.height / 2, span.z)
    seg.castShadow = true
    seg.receiveShadow = true
    root.add(seg)
  }
}

function addWindowWall(
  root: THREE.Group,
  wallMat: THREE.Material,
  frameMat: THREE.Material,
  glassMat: THREE.Material,
  span:
    | { fromX: number; toX: number; z: number; height: number }
    | { fromZ: number; toZ: number; x: number; height: number },
): void {
  const alongX = 'fromX' in span
  const length = alongX ? span.toX - span.fromX : span.toZ - span.fromZ
  const center = alongX ? (span.fromX + span.toX) / 2 : (span.fromZ + span.toZ) / 2
  const thickness = EXT_WALL

  const box = (len: number, height: number, y: number): THREE.Mesh => {
    const geo = alongX
      ? new THREE.BoxGeometry(len, height, thickness)
      : new THREE.BoxGeometry(thickness, height, len)
    const mesh = new THREE.Mesh(geo, wallMat)
    if (alongX) mesh.position.set(center, y, span.z)
    else mesh.position.set(span.x, y, center)
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  }

  root.add(box(length - PIER * 2, WINDOW_SILL, WINDOW_SILL / 2))
  root.add(box(length - PIER * 2, span.height - WINDOW_HEAD, (span.height + WINDOW_HEAD) / 2))
  for (const side of [-1, 1]) {
    const offset = center + (side * (length - PIER)) / 2
    const pier = new THREE.Mesh(
      alongX ? new THREE.BoxGeometry(PIER, span.height, thickness) : new THREE.BoxGeometry(thickness, span.height, PIER),
      wallMat,
    )
    if (alongX) pier.position.set(offset, span.height / 2, span.z)
    else pier.position.set(span.x, span.height / 2, offset)
    pier.castShadow = true
    pier.receiveShadow = true
    root.add(pier)
  }

  const glassHeight = WINDOW_HEAD - WINDOW_SILL
  const glassGeo = alongX
    ? new THREE.PlaneGeometry(length - PIER * 2, glassHeight)
    : new THREE.PlaneGeometry(glassHeight, length - PIER * 2)
  const glass = new THREE.Mesh(glassGeo, glassMat)
  if (alongX) glass.position.set(center, (WINDOW_SILL + WINDOW_HEAD) / 2, span.z)
  else {
    glass.position.set(span.x, (WINDOW_SILL + WINDOW_HEAD) / 2, center)
    glass.rotation.y = Math.PI / 2
  }
  root.add(glass)

  const spanLen = length - PIER * 2
  const bays = Math.max(2, Math.round(spanLen / 1.6))
  const step = spanLen / bays
  for (let i = 0; i <= bays; i++) {
    const offset = center - spanLen / 2 + i * step
    const mullion = new THREE.Mesh(
      alongX ? new THREE.BoxGeometry(0.06, glassHeight, thickness + 0.04) : new THREE.BoxGeometry(thickness + 0.04, glassHeight, 0.06),
      frameMat,
    )
    if (alongX) mullion.position.set(offset, (WINDOW_SILL + WINDOW_HEAD) / 2, span.z)
    else mullion.position.set(span.x, (WINDOW_SILL + WINDOW_HEAD) / 2, offset)
    mullion.castShadow = true
    root.add(mullion)
  }
}

function addBalcony(
  root: THREE.Group,
  slabMat: THREE.Material,
  frameMat: THREE.Material,
  glassMat: THREE.Material,
  balcony: RoomRect,
): void {
  const { cx, cz, w, d } = balcony
  const outward = cz > 0 ? 1 : -1

  const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.15, d), slabMat)
  slab.position.set(cx, -0.075, cz)
  slab.receiveShadow = true
  slab.castShadow = true
  root.add(slab)

  const railAt = (railLen: number, x: number, z: number, horizontal: boolean): void => {
    const glassGeo = horizontal ? new THREE.PlaneGeometry(railLen, RAIL_HEIGHT - 0.1) : new THREE.PlaneGeometry(RAIL_HEIGHT - 0.1, railLen)
    const rail = new THREE.Mesh(glassGeo, glassMat)
    rail.position.set(x, 0.15 + (RAIL_HEIGHT - 0.1) / 2 + 0.05, z)
    if (!horizontal) rail.rotation.y = Math.PI / 2
    root.add(rail)
    const top = new THREE.Mesh(
      horizontal ? new THREE.BoxGeometry(railLen, 0.06, 0.08) : new THREE.BoxGeometry(0.08, 0.06, railLen),
      frameMat,
    )
    top.position.set(x, 0.15 + RAIL_HEIGHT, z)
    top.castShadow = true
    root.add(top)
  }

  railAt(w, cx, cz + (outward * d) / 2, true)
  railAt(d, cx - w / 2, cz, false)
  railAt(d, cx + w / 2, cz, false)
}
