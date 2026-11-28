export type Vector3Tuple = [number, number, number]

/**
 * Per-frame animation callback stepped by the engine's own render loop.
 * Receives the frame delta (seconds) and total elapsed time (seconds).
 * Registered callbacks pause with the tab (battery-aware) and are cleared
 * automatically when the engine is disposed — consumers never need their
 * own requestAnimationFrame loop for scene motion.
 */
export type WorldTickFn = (delta: number, elapsed: number) => void

/** Unregister function returned by tick registration. */
export type UnregisterTick = () => void

export type EntityType =
  | 'person'
  | 'actor'
  | 'object'
  | 'equipment'
  | 'vehicle'
  | 'building'
  | 'structure'
  | 'zone'
  | (string & {})

export type EntityStatus =
  | 'idle'
  | 'running'
  | 'working'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'offline'
  | (string & {})

export interface WorldEntity {
  id: string
  type: EntityType
  name: string
  role?: string
  department?: string
  zoneId?: string
  description?: string
  status?: EntityStatus
  /**
   * Anchor slot this entity was placed on (mirrors `WorldPreset.slots` ids).
   */
  slotId?: string
  position: Vector3Tuple
  rotation?: Vector3Tuple
  scale?: Vector3Tuple
  avatarColor?: string
  avatarHair?: string
  deskColor?: string
  pinNumber?: number | string
  pinLabel?: string
  metadata?: Record<string, unknown>
}

/**
 * Occupant input accepted by `createEnvironment` — a full `WorldEntity` minus
 * the required placement fields. If `position` is omitted the entity is
 * auto-placed onto a preset slot (by `slotId`, by matching `id`, or the next
 * free slot in order), inheriting the slot's position, rotation, zoneId,
 * pinNumber and suggested avatarColor.
 */
export type EntityDraft = Omit<WorldEntity, 'position'> & { position?: Vector3Tuple }

/**
 * Architectural anchor point on a preset where a consumer entity can be
 * placed — a desk, workstation, field station, machine bay, etc. Slots carry
 * no occupant data: who (or what) sits there always comes from the consumer.
 */
export interface WorldSlot {
  id: string
  /** Neutral architectural label, e.g. "Executive desk", "Workstation 4". */
  label: string
  position: Vector3Tuple
  rotation?: Vector3Tuple
  zoneId?: string
  pinNumber?: number
  /** Suggested avatar color — consumer entities may override. */
  avatarColor?: string
  /** Free-form architecture hints, e.g. `{ desk: 'workstation', dualMonitor: true }`. */
  metadata?: Record<string, unknown>
}

export interface WorldZone {
  id: string
  name: string
  color?: string
  description?: string
  bounds?: {
    minX: number
    maxX: number
    minZ: number
    maxZ: number
  }
  cameraFocus?: Vector3Tuple
  metadata?: Record<string, unknown>
}

export interface CameraConfiguration {
  position: Vector3Tuple
  target: Vector3Tuple
  fov?: number
  near?: number
  far?: number
  enableDamping?: boolean
  dampingFactor?: number
  minDistance?: number
  maxDistance?: number
  maxPolarAngle?: number
}

export interface LightingConfiguration {
  ambientColor?: string
  ambientIntensity?: number
  sunColor?: string
  sunIntensity?: number
  sunPosition?: Vector3Tuple
  nightAmbientColor?: string
  nightAmbientIntensity?: number
  nightSunColor?: string
  nightSunIntensity?: number
  shadows?: boolean
  interiorSpots?: boolean
}

export interface WorldTheme {
  name: string
  floorColor?: string
  woodFloorColor?: string
  wallColor?: string
  wallFrameColor?: string
  glassColor?: string
  glassOpacity?: number
  accentColor?: string
  gridColor?: string
  gridSize?: [number, number]
  backgroundColor?: string
  nightBackgroundColor?: string
}

export interface WorldCapabilities {
  supportsRaycasting?: boolean
  supportsDayNight?: boolean
  supportsAnimations?: boolean
  supportsLOD?: boolean
  supportsDynamicLabels?: boolean
}

export interface WorldDefinition {
  id: string
  type: string
  name: string
  description?: string
  dimensions: {
    width: number
    height: number
    depth: number
  }
  camera: CameraConfiguration
  lighting: LightingConfiguration
  theme: WorldTheme
  zones: WorldZone[]
  entities: WorldEntity[]
  effects?: WorldEffects
  capabilities?: WorldCapabilities
  metadata?: Record<string, unknown>
}

export interface BloomEffects {
  strength?: number
  radius?: number
  threshold?: number
}

export interface WorldEffects {
  bloom?: boolean | BloomEffects
}

export interface WorldTourStop {
  id: string
  title?: string
  caption?: string
  position?: [number, number, number]
  target?: [number, number, number]
  holdSeconds?: number
}

export interface WorldTourConfig {
  stops: WorldTourStop[]
  autoRotateSpeed?: number
  transitionSeconds?: number
}

export interface CreateEnvironmentOptions {
  preset?: WorldPreset
  id?: string
  type?: string
  name?: string
  description?: string
  dimensions?: {
    width: number
    height: number
    depth: number
  }
  camera?: Partial<CameraConfiguration>
  lighting?: Partial<LightingConfiguration>
  theme?: Partial<WorldTheme>
  zones?: WorldZone[]
  entities?: EntityDraft[]
  effects?: WorldEffects
  metadata?: Record<string, unknown>
}

/**
 * Consumer-supplied grouping shown in the roster filter and the operations
 * dashboard. Pure org data — the package never ships defaults; when the
 * consumer passes none, groups are derived neutrally from preset zones.
 */
export interface DepartmentInfo {
  id: string
  name: string
  slug?: string
  description?: string
  color?: string
  slotIds?: string[]
  zoneId?: string
  iconName?: 'briefcase' | 'palette' | 'megaphone' | 'shield' | 'globe'
}

/** Options handed to a preset's `buildScene` when the engine builds the world. */
export interface BuildSceneOptions {
  nightMode?: boolean
  theme?: WorldTheme
  /**
   * Engine per-frame hook — register scene animations here (wind sway, water
   * ripples, machine motion…) instead of running a separate rAF loop.
   */
  registerTick?: (fn: WorldTickFn) => UnregisterTick
}

export interface WorldPreset {
  id: string
  name: string
  type: string
  description?: string
  dimensions: {
    width: number
    height: number
    depth: number
  }
  camera: CameraConfiguration
  lighting: LightingConfiguration
  theme: WorldTheme
  zones: WorldZone[]
  /** Architectural anchor points for consumer entities (no occupant data). */
  slots?: WorldSlot[]
  /** Optional demo occupants — shipped presets deliberately leave this empty. */
  defaultEntities?: EntityDraft[]
  effects?: WorldEffects
  buildScene?: (scene: import('three').Scene, options: BuildSceneOptions) => void
}

export type PinDisplayMode = 'pins' | 'labels' | 'off'

export interface EntitySelectedEvent {
  entity: WorldEntity
  position: Vector3Tuple
  screenPosition?: { x: number; y: number }
}
