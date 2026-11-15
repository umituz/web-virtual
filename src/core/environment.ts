import type {
  WorldDefinition,
  CreateEnvironmentOptions,
  WorldEntity,
  EntityDraft,
  WorldSlot,
  WorldZone,
  DepartmentInfo,
} from './types'

/**
 * Place entities onto preset anchor slots. Entities that already carry an
 * explicit `position` are kept as-is. Otherwise each entity is matched to a
 * slot by `slotId` (or its own `id`), falling back to the next free slot in
 * declaration order. Slot data (position, rotation, zoneId, pinNumber,
 * avatarColor) fills in any fields the entity left empty, so consumers only
 * describe WHO sits somewhere — never WHERE.
 */
export function placeEntitiesOnSlots(
  entities: EntityDraft[],
  slots: WorldSlot[],
): WorldEntity[] {
  const placed: WorldEntity[] = []

  if (slots.length === 0) {
    for (const entity of entities) {
      if (!entity.position) {
        console.warn(
          `[web-virtual] Entity "${entity.id}" has no position and the preset has no slots — it was skipped.`,
        )
        continue
      }
      placed.push(entity as WorldEntity)
    }
    return placed
  }

  const slotsById = new Map(slots.map((s) => [s.id, s]))
  const used = new Set<string>()

  for (const entity of entities) {
    if (entity.position) {
      placed.push(entity as WorldEntity)
      continue
    }

    const slot = (entity.slotId && slotsById.get(entity.slotId)) || slotsById.get(entity.id)
    const resolved = slot && !used.has(slot.id) ? slot : slots.find((s) => !used.has(s.id))

    if (!resolved) {
      console.warn(
        `[web-virtual] No free slot left for entity "${entity.id}" — it was skipped. ` +
          `Pass an explicit position or add more slots to the preset.`,
      )
      continue
    }

    used.add(resolved.id)
    placed.push({
      ...entity,
      slotId: resolved.id,
      position: resolved.position,
      rotation: entity.rotation ?? resolved.rotation,
      zoneId: entity.zoneId ?? resolved.zoneId,
      pinNumber: entity.pinNumber ?? resolved.pinNumber,
      avatarColor: entity.avatarColor ?? resolved.avatarColor,
    })
  }

  return placed
}

/**
 * Neutral department grouping derived from preset zones — used when the
 * consumer passes no `departments`. One group per zone, keyed by zone id.
 */
export function deriveDepartmentsFromZones(
  zones: WorldZone[],
  slots: WorldSlot[] = [],
): DepartmentInfo[] {
  return zones.map((zone) => ({
    id: `zone-${zone.id}`,
    name: zone.name,
    slug: zone.id,
    description: zone.description,
    color: zone.color,
    zoneId: zone.id,
    slotIds: slots.filter((s) => s.zoneId === zone.id).map((s) => s.id),
  }))
}

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

  // Occupants come from the consumer. If none are given, an optional preset
  // default may supply demo occupants. Either way, entities without an
  // explicit position are auto-placed onto the preset's architectural slots.
  const sourceEntities: EntityDraft[] =
    options.entities && options.entities.length > 0
      ? options.entities
      : (preset?.defaultEntities ?? [])
  const entities = placeEntitiesOnSlots(sourceEntities, preset?.slots ?? [])

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
