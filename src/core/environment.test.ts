import { describe, it, expect, vi } from 'vitest'
import {
  createEnvironment,
  validateEnvironment,
  placeEntitiesOnSlots,
  deriveDepartmentsFromZones,
} from './environment'
import type { EntityDraft } from './types'
import { officePreset, farmPreset, factoryPreset, OFFICE_SLOTS, FARM_SLOTS } from '../presets/index'

describe('Environment Factory & Presets', () => {
  it('creates an office environment with architecture but no occupants', () => {
    const world = createEnvironment({
      preset: officePreset,
      name: 'Nexora Agency HQ',
    })

    expect(world.name).toBe('Nexora Agency HQ')
    expect(world.type).toBe('office')
    expect(world.dimensions.width).toBe(36)
    expect(world.zones.length).toBe(6)
    expect(world.entities).toEqual([])
  })

  it('auto-places consumer occupants onto preset slots in order', () => {
    const occupants: EntityDraft[] = [
      { id: 'gm', type: 'person', name: 'Ayşe Yıldız', role: 'CEO', status: 'idle' },
      { id: 'dev', type: 'person', name: 'Mehmet Kaya', role: 'Developer', status: 'running' },
    ]

    const world = createEnvironment({
      preset: officePreset,
      name: 'Team HQ',
      entities: occupants,
    })

    expect(world.entities).toHaveLength(2)
    expect(world.entities[0]!.slotId).toBe('slot-1')
    expect(world.entities[0]!.position).toEqual(OFFICE_SLOTS[0]!.position)
    expect(world.entities[0]!.zoneId).toBe('executive')
    expect(world.entities[0]!.pinNumber).toBe(1)
    expect(world.entities[0]!.avatarColor).toBe(OFFICE_SLOTS[0]!.avatarColor)
    expect(world.entities[1]!.slotId).toBe('slot-2')
    expect(world.entities[1]!.position).toEqual(OFFICE_SLOTS[1]!.position)
    // Omitted fields inherit the slot's architectural suggestion
    expect(world.entities[1]!.avatarColor).toBe(OFFICE_SLOTS[1]!.avatarColor)
    expect(world.entities[1]!.zoneId).toBe('growth')
  })

  it('lets consumer fields override slot suggestions', () => {
    const world = createEnvironment({
      preset: officePreset,
      name: 'HQ',
      entities: [{ id: 'slot-1', type: 'person', name: 'GM', avatarColor: '#ff0055', zoneId: 'meeting' }],
    })

    expect(world.entities[0]!.avatarColor).toBe('#ff0055')
    expect(world.entities[0]!.zoneId).toBe('meeting')
    expect(world.entities[0]!.position).toEqual(OFFICE_SLOTS[0]!.position)
  })

  it('pins an occupant to a specific slot via slotId and keeps explicit positions', () => {
    const occupants: EntityDraft[] = [
      { id: 'founder', slotId: 'slot-17', type: 'person', name: 'Founder' },
      { id: 'visitor', type: 'person', name: 'Visitor', position: [0, 0, 0] },
    ]

    const world = createEnvironment({ preset: officePreset, name: 'HQ', entities: occupants })

    expect(world.entities[0]!.slotId).toBe('slot-17')
    expect(world.entities[0]!.position).toEqual(OFFICE_SLOTS[16]!.position)
    // Explicit positions pass through untouched and do not consume a slot
    expect(world.entities[1]!.position).toEqual([0, 0, 0])
    expect(world.entities[1]!.slotId).toBeUndefined()
  })

  it('skips occupants when no free slot is left and warns', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const slots = FARM_SLOTS.slice(0, 1)
      const placed = placeEntitiesOnSlots(
        [
          { id: 'a', type: 'person', name: 'A' },
          { id: 'b', type: 'person', name: 'B' },
        ],
        slots,
      )
      expect(placed).toHaveLength(1)
      expect(placed[0]!.slotId).toBe('slot-1')
      expect(consoleWarn).toHaveBeenCalledTimes(1)
    } finally {
      consoleWarn.mockRestore()
    }
  })

  it('keeps farm and factory presets slot-based and occupant-free', () => {
    const farm = createEnvironment({ preset: farmPreset, name: 'Agromera Farm' })
    expect(farm.type).toBe('farm')
    expect(farm.zones.length).toBe(5)
    expect(farm.entities).toEqual([])

    const factory = createEnvironment({ preset: factoryPreset, name: 'Auto Plant 4' })
    expect(factory.type).toBe('factory')
    expect(factory.entities).toEqual([])
  })

  it('derives neutral departments from zones with their slots', () => {
    const departments = deriveDepartmentsFromZones(
      [
        { id: 'greenhouse', name: 'Greenhouse', color: '#22c55e' },
        { id: 'barn', name: 'Barn' },
      ],
      [
        { id: 'slot-1', label: 'Greenhouse station', position: [0, 0, 0], zoneId: 'greenhouse' },
        { id: 'slot-2', label: 'Barn station', position: [1, 0, 0], zoneId: 'barn' },
      ],
    )

    expect(departments).toHaveLength(2)
    expect(departments[0]).toMatchObject({ slug: 'greenhouse', name: 'Greenhouse', color: '#22c55e', slotIds: ['slot-1'] })
    expect(departments[1]).toMatchObject({ slug: 'barn', slotIds: ['slot-2'] })
  })

  it('validates environment entity ids and positions', () => {
    expect(() => {
      validateEnvironment({
        id: '',
        type: 'test',
        name: 'Invalid World',
        dimensions: { width: 10, height: 10, depth: 10 },
        camera: { position: [0, 0, 0], target: [0, 0, 0] },
        lighting: {},
        theme: { name: 'test' },
        zones: [],
        entities: [],
      })
    }).toThrow('WorldDefinition must have a valid id')
  })
})
