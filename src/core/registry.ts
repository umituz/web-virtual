import type { WorldEntity, WorldZone, WorldDefinition } from './types'

export class EntityRegistry {
  private entities: Map<string, WorldEntity> = new Map()
  private zones: Map<string, WorldZone> = new Map()
  private entityZoneIndex: Map<string, Set<string>> = new Map()

  constructor(world?: WorldDefinition) {
    if (world) {
      this.loadWorld(world)
    }
  }

  loadWorld(world: WorldDefinition): void {
    this.clear()
    for (const zone of world.zones) {
      this.zones.set(zone.id, zone)
    }
    for (const entity of world.entities) {
      this.registerEntity(entity)
    }
  }

  registerEntity(entity: WorldEntity): void {
    this.entities.set(entity.id, entity)
    if (entity.zoneId) {
      if (!this.entityZoneIndex.has(entity.zoneId)) {
        this.entityZoneIndex.set(entity.zoneId, new Set())
      }
      this.entityZoneIndex.get(entity.zoneId)!.add(entity.id)
    }
  }

  getEntity(id: string): WorldEntity | undefined {
    return this.entities.get(id)
  }

  getEntities(): WorldEntity[] {
    return Array.from(this.entities.values())
  }

  getZone(id: string): WorldZone | undefined {
    return this.zones.get(id)
  }

  getZones(): WorldZone[] {
    return Array.from(this.zones.values())
  }

  getEntitiesByZone(zoneId: string): WorldEntity[] {
    const ids = this.entityZoneIndex.get(zoneId)
    if (!ids) return []
    return Array.from(ids)
      .map((id) => this.entities.get(id))
      .filter((e): e is WorldEntity => e !== undefined)
  }

  updateEntity(id: string, partial: Partial<WorldEntity>): WorldEntity | undefined {
    const existing = this.entities.get(id)
    if (!existing) return undefined
    const updated: WorldEntity = { ...existing, ...partial }
    this.registerEntity(updated)
    return updated
  }

  removeEntity(id: string): boolean {
    const existing = this.entities.get(id)
    if (!existing) return false
    if (existing.zoneId && this.entityZoneIndex.has(existing.zoneId)) {
      this.entityZoneIndex.get(existing.zoneId)!.delete(id)
    }
    return this.entities.delete(id)
  }

  clear(): void {
    this.entities.clear()
    this.zones.clear()
    this.entityZoneIndex.clear()
  }
}
