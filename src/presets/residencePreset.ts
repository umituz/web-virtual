import { MaterialPalette } from '../engine/materials'
import type { WorldPreset, WorldZone } from '../core/types'
import {
  buildResidenceArchitecture,
  loadResidenceFurniture,
} from '../entities/architecture/ResidenceArchitectureBuilder'

export type RoomKind =
  | 'living'
  | 'kitchen'
  | 'bedroom'
  | 'masterBedroom'
  | 'bathroom'
  | 'hall'
  | 'balcony'

export type FloorMaterial = 'wood' | 'tile' | 'concrete'

export interface RoomStyle {
  kind: RoomKind
  color: string
  floor: FloorMaterial
  labelKey: string
}

export const ROOM_STYLES: Record<RoomKind, RoomStyle> = {
  living: { kind: 'living', color: '#3b82f6', floor: 'wood', labelKey: 'tour.room.living' },
  kitchen: { kind: 'kitchen', color: '#f59e0b', floor: 'tile', labelKey: 'tour.room.kitchen' },
  masterBedroom: { kind: 'masterBedroom', color: '#8b5cf6', floor: 'wood', labelKey: 'tour.room.masterBedroom' },
  bedroom: { kind: 'bedroom', color: '#06b6d4', floor: 'wood', labelKey: 'tour.room.bedroom' },
  bathroom: { kind: 'bathroom', color: '#10b981', floor: 'tile', labelKey: 'tour.room.bathroom' },
  hall: { kind: 'hall', color: '#64748b', floor: 'wood', labelKey: 'tour.room.hall' },
  balcony: { kind: 'balcony', color: '#ec4899', floor: 'concrete', labelKey: 'tour.room.balcony' },
}

export function roomDisplayName(kind: RoomKind, localizedKind: string, index?: number): string {
  if ((kind === 'bedroom' || kind === 'bathroom') && index !== undefined && index > 1) {
    return `${localizedKind} ${index}`
  }
  return localizedKind
}

export type FacadeSide = 'south' | 'north' | 'east' | 'west'

export interface OrientationInfo {
  facade: FacadeSide
  panoramic: boolean
  sunPosition: [number, number, number]
}

const FACADE_MATCHERS: Array<[RegExp, FacadeSide]> = [
  [/panoramic|panoramik/i, 'south'],
  [/south.?west|güney.?batı|gb/i, 'south'],
  [/south.?east|güney.?doğu|gd/i, 'south'],
  [/south|güney/i, 'south'],
  [/north.?east|kuzey.?doğu|kd/i, 'north'],
  [/north.?west|kuzey.?batı|kb/i, 'north'],
  [/north|kuzey/i, 'north'],
  [/east|doğu/i, 'east'],
  [/west|batı/i, 'west'],
]

const SUN_BY_FACADE: Record<FacadeSide, [number, number, number]> = {
  south: [10, 30, 22],
  north: [0, 32, 22],
  east: [20, 30, 18],
  west: [-20, 30, 18],
}

export function resolveOrientation(raw: string | null | undefined): OrientationInfo {
  const text = (raw ?? '').trim()
  const panoramic = /panoramic|panoramik/i.test(text)
  let facade: FacadeSide = 'south'
  if (!panoramic && text) {
    for (const [re, side] of FACADE_MATCHERS) {
      if (re.test(text)) {
        facade = side
        break
      }
    }
  }
  return { facade, panoramic, sunPosition: SUN_BY_FACADE[facade] }
}

export interface Rect {
  cx: number
  cz: number
  w: number
  d: number
}

export interface RoomRect extends Rect {
  id: string
  kind: RoomKind
  index?: number
  extras?: Rect[]
}

export interface FurnitureAnchor {
  asset: string
  x: number
  z: number
  y?: number
  rotY: number
  scale: number
}

export interface ResidenceLayout {
  kind: 'apartment' | 'studio'
  dayZ0: number
  nightZ1: number
  nightWallRooms: RoomRect[]
  nightDividers: number[]
}

export interface ResidencePlan {
  footprint: { w: number; d: number }
  wallHeight: number
  rooms: RoomRect[]
  furniture: FurnitureAnchor[]
  entryX: number
  layout: ResidenceLayout
  orientation: OrientationInfo
}

export interface TourPlanInput {
  areaSqm: number
  bedrooms: number | null
  bathrooms: number | null
  unitType: string
  orientation: OrientationInfo
}

const WALL_HEIGHT = 2.7
const BALCONY_DEPTH = 1.5

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function solveFootprint(area: number, needDepth: number): { w: number; d: number } {
  for (const ar of [1.35, 1.25, 1.15, 1.05, 1.0]) {
    const w = Math.sqrt(area * ar)
    const d = Math.sqrt(area / ar)
    if (d >= needDepth) return { w: round1(w), d: round1(d) }
  }
  return { w: round1(Math.sqrt(area)), d: round1(Math.sqrt(area)) }
}

function round1(v: number): number {
  return Math.round(v * 10) / 10
}

function splitWidths(total: number, parts: Array<{ min: number; weight?: number }>): number[] {
  const weights = parts.map((p) => p.weight ?? p.min)
  const weightSum = weights.reduce((a, b) => a + b, 0)
  let widths = parts.map((p, i) => Math.max(p.min, (total * (weights[i] ?? p.min)) / (weightSum || 1)))
  let deficit = widths.reduce((a, b) => a + b, 0) - total
  while (deficit > 0.01) {
    const flexible = widths.map((w, i) => ({ w, i, can: w - (parts[i]?.min ?? 0) })).filter((f) => f.can > 0.01)
    if (flexible.length === 0) {
      const sum = widths.reduce((a, b) => a + b, 0) || 1
      widths = widths.map((w) => (w / sum) * total)
      break
    }
    const take = Math.min(deficit, ...flexible.map((f) => f.can))
    const biggest = flexible.reduce((a, b) => (a.can >= b.can ? a : b))
    const currentW = widths[biggest.i] ?? 0
    widths[biggest.i] = currentW - take
    deficit -= take
  }
  return widths.map(round1)
}

export function buildResidencePlan(input: TourPlanInput): ResidencePlan {
  const area = clamp(input.areaSqm || 50, 30, 180)
  const isStudio = input.bedrooms === 0 || input.unitType === 'STUDIO'
  const n = clamp(isStudio ? 0 : (input.bedrooms ?? 1), 0, 4)
  const m = clamp(input.bathrooms ?? 1, 1, 3)

  const minArea = 26 + n * 11 + m * 6
  const areaWithWalls = Math.max(area * 1.06, minArea)

  const needDepth = isStudio ? 3.6 + 2.2 : 3.6 + 1.0 + 2.6
  const { w: W, d: D } = solveFootprint(areaWithWalls, needDepth)

  const rooms: RoomRect[] = []
  const furniture: FurnitureAnchor[] = []
  const halfW = W / 2
  const halfD = D / 2
  const facadeZ = halfD

  if (isStudio) {
    const backRowDepth = clamp(0.38 * D, 2.2, 3.0)
    const openDepth = D - backRowDepth
    const widths = splitWidths(W, [{ min: 1.9, weight: 2.2 }, { min: 1.8, weight: 2 }])
    const bathW = widths[0] ?? 2.2
    const hallW = widths[1] ?? 2.0
    const bathCx = -halfW + bathW / 2
    const hallCx = -halfW + bathW + hallW / 2
    const openCz = -halfD + backRowDepth + openDepth / 2

    const livingRoom: RoomRect = {
      id: 'room-living',
      kind: 'living',
      cx: 0,
      cz: openCz,
      w: W,
      d: openDepth,
    }
    const bathRoom: RoomRect = {
      id: 'room-bathroom-1',
      kind: 'bathroom',
      index: 1,
      cx: bathCx,
      cz: -halfD + backRowDepth / 2,
      w: bathW,
      d: backRowDepth,
    }
    const hallRoom: RoomRect = {
      id: 'room-hall',
      kind: 'hall',
      cx: hallCx,
      cz: -halfD + backRowDepth / 2,
      w: hallW,
      d: backRowDepth,
    }

    rooms.push(livingRoom, bathRoom, hallRoom)

    const dayZ0 = -halfD + backRowDepth
    addLivingFurniture(furniture, 0, dayZ0, W, openDepth, facadeZ, true)
    addKitchenette(furniture, -halfW, dayZ0, openDepth)

    const bedAsset = area >= 50 ? '/assets/models/residence/bedDouble.glb' : '/assets/models/residence/bedSingle.glb'
    furniture.push(
      { asset: bedAsset, x: halfW - 1.1, z: openCz + openDepth * 0.25, rotY: -Math.PI / 2, scale: 1 },
      { asset: '/assets/models/residence/rugRectangle.glb', x: halfW - 2.2, z: openCz + openDepth * 0.25, rotY: 0, scale: 1.2 },
      { asset: '/assets/models/residence/sideTableDrawers.glb', x: halfW - 0.45, z: openCz + openDepth * 0.25 + 1.1, rotY: -Math.PI / 2, scale: 0.9 },
    )
    addBathroomFurniture(furniture, bathRoom, true)
    furniture.push(
      { asset: '/assets/models/residence/coatRackStanding.glb', x: hallCx, z: -halfD + 0.45, rotY: 0, scale: 1 },
      { asset: '/assets/models/residence/rugDoormat.glb', x: hallCx, z: -halfD + 1.1, rotY: 0, scale: 1 },
    )
    addBalconyFurniture(furniture, livingRoom)

    const backRowZ1 = -halfD + backRowDepth
    return {
      footprint: { w: W, d: D },
      wallHeight: WALL_HEIGHT,
      rooms,
      furniture,
      entryX: hallCx,
      layout: {
        kind: 'studio',
        dayZ0: backRowZ1,
        nightZ1: backRowZ1,
        nightWallRooms: [bathRoom, hallRoom],
        nightDividers: [-halfW + bathW],
      },
      orientation: input.orientation,
    }
  }

  const dDay = clamp(0.45 * D, 3.6, 5.0)
  let dNight = clamp(D - dDay - 1.1, 2.6, 4.4)
  const corridor = clamp(D - dDay - dNight, 1.0, 1.6)
  dNight = round1(D - dDay - corridor)

  const dayZ0 = halfD - dDay
  const nightZ1 = -halfD + dNight
  const corridorCz = (dayZ0 + nightZ1) / 2

  const kitchenW = clamp((0.13 * areaWithWalls) / dDay, 2.2, 3.6)
  const salonW = Math.max(W - kitchenW, 3.6)
  const salonCx = -halfW + kitchenW + salonW / 2
  const kitchenCx = -halfW + Math.min(kitchenW, W - salonW) / 2

  const livingRoom: RoomRect = { id: 'room-living', kind: 'living', cx: salonCx, cz: dayZ0 + dDay / 2, w: salonW, d: dDay }
  const kitchenRoom: RoomRect = { id: 'room-kitchen', kind: 'kitchen', cx: kitchenCx, cz: dayZ0 + dDay / 2, w: Math.min(kitchenW, W - salonW), d: dDay }

  rooms.push(livingRoom, kitchenRoom)

  const nightParts: Array<{ min: number; weight: number }> = []
  nightParts.push({ min: 3.0, weight: 4 })
  for (let i = 1; i < n; i++) nightParts.push({ min: 2.6, weight: 3 })
  for (let i = 0; i < m; i++) nightParts.push({ min: 1.9, weight: 2.1 })
  nightParts.push({ min: 1.8, weight: 2 })
  const nightWidths = splitWidths(W, nightParts)

  let cursor = -halfW
  let bedroomIndex = 0
  let bathroomIndex = 0
  let hallCx = 0
  const nightRooms: RoomRect[] = []
  const nightDividers: number[] = []
  for (let i = 0; i < nightParts.length; i++) {
    const width = nightWidths[i] ?? 2.5
    const cx = cursor + width / 2
    const kindIndex = i
    let pushed: RoomRect | null = null
    if (kindIndex === 0 && n >= 1) {
      pushed = { id: 'room-bedroom-1', kind: 'masterBedroom', index: 1, cx, cz: -halfD + dNight / 2, w: width, d: dNight }
      addBedroomFurniture(furniture, pushed, true)
      bedroomIndex = 1
    } else if (kindIndex <= n - 1 && n > 1) {
      bedroomIndex += 1
      pushed = { id: `room-bedroom-${bedroomIndex}`, kind: 'bedroom', index: bedroomIndex, cx, cz: -halfD + dNight / 2, w: width, d: dNight }
      addBedroomFurniture(furniture, pushed, false)
    } else if (kindIndex <= n - 1 + m) {
      bathroomIndex += 1
      pushed = { id: `room-bathroom-${bathroomIndex}`, kind: 'bathroom', index: bathroomIndex, cx, cz: -halfD + dNight / 2, w: width, d: dNight }
      addBathroomFurniture(furniture, pushed, bathroomIndex === 1)
    } else {
      hallCx = cx
      pushed = {
        id: 'room-hall',
        kind: 'hall',
        cx,
        cz: -halfD + dNight / 2,
        w: width,
        d: dNight,
        extras: [{ cx: 0, cz: corridorCz, w: W, d: corridor }],
      }
      furniture.push(
        { asset: '/assets/models/residence/coatRackStanding.glb', x: cx, z: -halfD + 0.45, rotY: 0, scale: 1 },
        { asset: '/assets/models/residence/rugDoormat.glb', x: cx, z: -halfD + 1.1, rotY: 0, scale: 1 },
      )
    }
    if (pushed) {
      rooms.push(pushed)
      nightRooms.push(pushed)
      if (i > 0) nightDividers.push(round1(cursor))
    }
    cursor += width
  }

  addLivingFurniture(furniture, salonCx, dayZ0, salonW, dDay, facadeZ, false)
  addKitchenFurniture(furniture, kitchenRoom)

  const balconyRoom: RoomRect = { id: 'room-balcony-1', kind: 'balcony', index: 1, cx: salonCx, cz: halfD + BALCONY_DEPTH / 2, w: Math.min(salonW, 5.4), d: BALCONY_DEPTH }
  rooms.push(balconyRoom)
  addBalconyFurniture(furniture, balconyRoom)

  if (input.orientation.panoramic && area >= 130) {
    const master = rooms.find((r) => r.kind === 'masterBedroom')
    if (master) {
      rooms.push({ id: 'room-balcony-2', kind: 'balcony', index: 2, cx: master.cx, cz: -halfD - BALCONY_DEPTH / 2, w: Math.min(master.w, 4.6), d: BALCONY_DEPTH })
    }
  }

  return {
    footprint: { w: W, d: D },
    wallHeight: WALL_HEIGHT,
    rooms,
    furniture,
    entryX: hallCx,
    layout: {
      kind: 'apartment',
      dayZ0,
      nightZ1,
      nightWallRooms: nightRooms,
      nightDividers,
    },
    orientation: input.orientation,
  }
}

function addLivingFurniture(
  out: FurnitureAnchor[],
  cx: number,
  dayZ0: number,
  w: number,
  d: number,
  _facadeZ: number,
  studio: boolean,
): void {
  const tvZ = dayZ0 + 0.35
  out.push(
    { asset: '/assets/models/residence/cabinetTelevision.glb', x: cx, z: tvZ, rotY: 0, scale: 1 },
    { asset: '/assets/models/residence/televisionModern.glb', x: cx, z: tvZ, y: 0.62, rotY: 0, scale: 1 },
    { asset: 'furniture:loungeSofa', x: cx, z: dayZ0 + 2.1, rotY: Math.PI, scale: 1.4 },
    { asset: 'furniture:tableCoffee', x: cx, z: dayZ0 + 1.25, rotY: 0, scale: 1.2 },
    { asset: '/assets/models/residence/rugRectangle.glb', x: cx, z: dayZ0 + 1.7, rotY: 0, scale: 1.3 },
  )
  const plantX = studio ? cx - w / 2 + 0.6 : cx + w / 2 - 0.6
  out.push(
    { asset: 'decor:pottedPlant', x: plantX, z: dayZ0 + d - 0.7, rotY: 0, scale: 1.2 },
    { asset: 'decor:lampFloor', x: plantX, z: dayZ0 + d - 1.8, rotY: 0, scale: 1.2 },
  )
}

function addKitchenFurniture(out: FurnitureAnchor[], room: RoomRect): void {
  const z0 = room.cz - room.d / 2 + 0.35
  out.push(
    { asset: '/assets/models/residence/kitchenCabinet.glb', x: room.cx - 1.1, z: z0, rotY: 0, scale: 1 },
    { asset: '/assets/models/residence/kitchenStove.glb', x: room.cx, z: z0, rotY: 0, scale: 1 },
    { asset: '/assets/models/residence/kitchenCabinet.glb', x: room.cx + 1.1, z: z0, rotY: 0, scale: 1 },
    { asset: '/assets/models/residence/kitchenFridge.glb', x: room.cx + room.w / 2 - 0.45, z: z0 + 1.2, rotY: Math.PI / 2, scale: 1 },
    { asset: '/assets/models/residence/kitchenCabinetUpper.glb', x: room.cx - 1.1, z: z0 - 0.06, y: 1.5, rotY: 0, scale: 1 },
  )
}

function addKitchenette(out: FurnitureAnchor[], leftX: number, z0: number, depth: number): void {
  const x = leftX + 0.35
  const zc = z0 + depth / 2
  out.push(
    { asset: '/assets/models/residence/kitchenCabinet.glb', x, z: zc - 1.1, rotY: Math.PI / 2, scale: 1 },
    { asset: '/assets/models/residence/kitchenStove.glb', x, z: zc, rotY: Math.PI / 2, scale: 1 },
    { asset: '/assets/models/residence/kitchenFridge.glb', x, z: zc + 1.15, rotY: Math.PI / 2, scale: 1 },
  )
}

function addBedroomFurniture(out: FurnitureAnchor[], room: RoomRect, master: boolean): void {
  const bedZ = room.cz - room.d / 2 + 0.75
  const bedAsset = master ? '/assets/models/residence/bedDouble.glb' : '/assets/models/residence/bedSingle.glb'
  out.push(
    { asset: bedAsset, x: room.cx, z: bedZ, rotY: 0, scale: 1 },
    { asset: '/assets/models/residence/rugRectangle.glb', x: room.cx, z: bedZ + 1.6, rotY: 0, scale: 1.1 },
    { asset: '/assets/models/residence/sideTableDrawers.glb', x: room.cx + (master ? 1.05 : 0.75), z: bedZ + 0.1, rotY: 0, scale: 0.9 },
  )
  if (room.w >= 3.0) {
    out.push({ asset: '/assets/models/residence/bookcaseClosedDoors.glb', x: room.cx - room.w / 2 + 0.4, z: room.cz + 0.8, rotY: Math.PI / 2, scale: 1.1 })
  }
}

function addBathroomFurniture(out: FurnitureAnchor[], room: RoomRect, primary: boolean): void {
  const backZ = room.cz - room.d / 2 + 0.5
  const sideX = room.cx + room.w / 2 - 0.35
  if (primary) {
    out.push({ asset: '/assets/models/residence/bathtub.glb', x: room.cx - room.w / 2 + 0.95, z: backZ + 0.15, rotY: 0, scale: 1 })
  } else {
    out.push({ asset: '/assets/models/residence/shower.glb', x: room.cx - room.w / 2 + 0.55, z: room.cz - room.d / 2 + 0.55, rotY: 0, scale: 1 })
  }
  out.push(
    { asset: '/assets/models/residence/toilet.glb', x: sideX, z: room.cz + 0.5, rotY: -Math.PI / 2, scale: 1 },
    { asset: '/assets/models/residence/bathroomSink.glb', x: sideX, z: room.cz - 0.5, rotY: -Math.PI / 2, scale: 1 },
    { asset: '/assets/models/residence/bathroomMirror.glb', x: sideX - 0.08, z: room.cz - 0.5, y: 1.35, rotY: -Math.PI / 2, scale: 1 },
  )
}

function addBalconyFurniture(out: FurnitureAnchor[], room: RoomRect): void {
  const inward = room.cz > 0 ? Math.PI : 0
  out.push(
    { asset: 'furniture:loungeChair', x: room.cx - room.w / 2 + 0.55, z: room.cz, rotY: inward, scale: 1.2 },
    { asset: '/assets/models/residence/plantSmall2.glb', x: room.cx + room.w / 2 - 0.45, z: room.cz, rotY: 0, scale: 1 },
  )
}

export function roomArea(room: RoomRect): number {
  return Math.round(room.w * room.d * 10) / 10
}

export function interiorRooms(plan: ResidencePlan): RoomRect[] {
  return plan.rooms.filter((r) => r.kind !== 'balcony')
}

export function balconyRooms(plan: ResidencePlan): RoomRect[] {
  return plan.rooms.filter((r) => r.kind === 'balcony')
}

const KIND_NAMES: Record<string, string> = {
  living: 'Living room',
  kitchen: 'Kitchen',
  masterBedroom: 'Master bedroom',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  hall: 'Hallway',
  balcony: 'Balcony',
}

export function planToZones(plan: ResidencePlan): WorldZone[] {
  return plan.rooms.map((room): WorldZone => {
    const style = ROOM_STYLES[room.kind]
    const suffix = room.index && room.index > 1 ? ` ${room.index}` : ''
    return {
      id: room.id,
      name: `${KIND_NAMES[room.kind] ?? room.kind}${suffix}`,
      color: style.color,
      bounds: {
        minX: room.cx - room.w / 2,
        maxX: room.cx + room.w / 2,
        minZ: room.cz - room.d / 2,
        maxZ: room.cz + room.d / 2,
      },
      cameraFocus: [room.cx, 1.2, room.cz],
      metadata: { roomKind: room.kind },
    }
  })
}

export function buildResidencePreset(plan: ResidencePlan): WorldPreset {
  const { w: W, d: D } = plan.footprint
  return {
    id: 'preset-residence-tour',
    name: 'Residence Virtual Tour',
    type: 'residence',
    description: `Parameterized ${Math.round(W * D)} m² apartment floorplan generated from unit data.`,
    dimensions: { width: W, height: plan.wallHeight, depth: D },
    camera: {
      position: [W * 1.05, W * 0.85, D * 1.35],
      target: [0, 0.8, 0],
      fov: 42,
      near: 0.1,
      far: 250,
      enableDamping: true,
      dampingFactor: 0.06,
      minDistance: 4,
      maxDistance: Math.max(45, W * 3),
      maxPolarAngle: Math.PI / 2 - 0.05,
    },
    lighting: {
      ambientColor: '#ffffff',
      ambientIntensity: 0.95,
      sunColor: '#fff4e6',
      sunIntensity: 1.25,
      sunPosition: plan.orientation.sunPosition,
      nightAmbientColor: '#1e293b',
      nightAmbientIntensity: 0.4,
      nightSunColor: '#7dd3fc',
      nightSunIntensity: 0.45,
      shadows: true,
    },
    theme: {
      name: 'residence-bright',
      floorColor: '#f1f5f9',
      woodFloorColor: '#c8a273',
      wallColor: '#f1f5f9',
      wallFrameColor: '#1e293b',
      glassColor: '#bae6fd',
      glassOpacity: 0.22,
      accentColor: '#3b82f6',
      backgroundColor: '#f8fafc',
      nightBackgroundColor: '#0f172a',
    },
    zones: planToZones(plan),
    slots: [],
    buildScene: (scene, options) => {
      const arch = buildResidenceArchitecture(new MaterialPalette(), { plan, nightMode: options.nightMode })
      scene.add(arch)
      loadResidenceFurniture(scene, plan)
    },
  }
}
