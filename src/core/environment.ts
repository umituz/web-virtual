import type {
  WorldDefinition,
  CreateEnvironmentOptions,
  WorldEntity,
} from './types'

export function createEnvironment(options: CreateEnvironmentOptions): WorldDefinition {
  const preset = options.preset

  const id = options.id || preset?.id || `world-${Date.now()}`
  const type = options.type || preset?.type || 'generic'
  const name = options.name || preset?.name || 'Virtual World'
  const description = options.description || preset?.description

  const dimensions = options.dimensions || preset?.dimensions || {
    width: 50,
    height: 10,
    depth: 30,
  }

  const camera = {
    position: [26, 24, 26] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    fov: 40,
    near: 0.1,
    far: 200,
    enableDamping: true,
    dampingFactor: 0.05,
    minDistance: 8,
    maxDistance: 65,
    maxPolarAngle: Math.PI / 2 - 0.05,
    ...(preset?.camera || {}),
    ...(options.camera || {}),
  }

  const lighting = {
    ambientColor: '#ffffff',
    ambientIntensity: 0.85,
    sunColor: '#fff5ea',
    sunIntensity: 1.1,
    sunPosition: [20, 30, 15] as [number, number, number],
    nightAmbientColor: '#1e293b',
    nightAmbientIntensity: 0.35,
    nightSunColor: '#60a5fa',
    nightSunIntensity: 0.4,
    shadows: true,
    ...(preset?.lighting || {}),
    ...(options.lighting || {}),
  }

  const theme = {
    name: 'default',
    floorColor: '#f1f5f9',
    woodFloorColor: '#c29b71',
    wallColor: '#cbd5e1',
    wallFrameColor: '#1e293b',
    glassColor: '#93c5fd',
    glassOpacity: 0.28,
    accentColor: '#3b82f6',
    gridColor: '#94a3b8',
    backgroundColor: '#f8fafc',
    nightBackgroundColor: '#0f172a',
    ...(preset?.theme || {}),
    ...(options.theme || {}),
  }

  const zones = options.zones || preset?.zones || []

  // If user provided entities, use them; otherwise if preset has defaults, use those
  let entities: WorldEntity[] = []
  if (options.entities && options.entities.length > 0) {
    entities = options.entities
  } else if (preset?.defaultEntities) {
    entities = preset.defaultEntities
  }

  const world: WorldDefinition = {
    id,
    type,
    name,
    description,
    dimensions,
    camera,
    lighting,
    theme,
    zones,
    entities,
    metadata: options.metadata || {},
  }

  validateEnvironment(world)
  return world
}

export function validateEnvironment(world: WorldDefinition): void {
  if (!world.id) {
    throw new Error('WorldDefinition must have a valid id')
  }
  if (!world.name) {
    throw new Error('WorldDefinition must have a valid name')
  }
  if (world.dimensions.width <= 0 || world.dimensions.depth <= 0) {
    throw new Error('World dimensions width and depth must be positive numbers')
  }

  const idSet = new Set<string>()
  for (const entity of world.entities) {
    if (!entity.id) {
      throw new Error('Every entity must have a non-empty id')
    }
    if (idSet.has(entity.id)) {
      console.warn(`[web-virtual] Warning: Duplicate entity ID "${entity.id}" found in environment.`)
    }
    idSet.add(entity.id)

    if (!Array.isArray(entity.position) || entity.position.length !== 3) {
      throw new Error(`Entity "${entity.id}" must have a valid [x, y, z] position tuple`)
    }
  }
}
