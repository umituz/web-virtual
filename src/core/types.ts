export type Vector3Tuple = [number, number, number]

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
  capabilities?: WorldCapabilities
  metadata?: Record<string, unknown>
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
  entities?: WorldEntity[]
  metadata?: Record<string, unknown>
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
  defaultEntities?: WorldEntity[]
  buildScene?: (scene: import('three').Scene, options: { nightMode?: boolean; theme?: WorldTheme }) => void
}

export type PinDisplayMode = 'pins' | 'labels' | 'off'

export interface EntitySelectedEvent {
  entity: WorldEntity
  position: Vector3Tuple
  screenPosition?: { x: number; y: number }
}
