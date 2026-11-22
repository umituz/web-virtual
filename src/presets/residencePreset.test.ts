import { describe, expect, it } from 'vitest'
import {
  buildResidencePlan,
  buildResidencePreset,
  planToZones,
  resolveOrientation,
  roomArea,
  roomDisplayName,
} from './residencePreset'

describe('resolveOrientation', () => {
  it('defaults to south facade', () => {
    const o = resolveOrientation(null)
    expect(o.facade).toBe('south')
    expect(o.panoramic).toBe(false)
  })

  it('detects north facade', () => {
    const o = resolveOrientation('Kuzey Cephe')
    expect(o.facade).toBe('north')
  })

  it('detects panoramic units', () => {
    const o = resolveOrientation('Panoramik Deniz Manzaralı')
    expect(o.panoramic).toBe(true)
  })
})

describe('buildResidencePlan', () => {
  it('generates studio plan correctly', () => {
    const orientation = resolveOrientation('south')
    const plan = buildResidencePlan({
      areaSqm: 42,
      bedrooms: 0,
      bathrooms: 1,
      unitType: 'STUDIO',
      orientation,
    })
    expect(plan.layout.kind).toBe('studio')
    expect(plan.rooms.some((r) => r.kind === 'living')).toBe(true)
    expect(plan.rooms.some((r) => r.kind === 'bathroom')).toBe(true)
    expect(plan.furniture.length).toBeGreaterThan(0)
  })

  it('generates 2-bedroom apartment plan correctly', () => {
    const orientation = resolveOrientation('east')
    const plan = buildResidencePlan({
      areaSqm: 95,
      bedrooms: 2,
      bathrooms: 2,
      unitType: '2+1',
      orientation,
    })
    expect(plan.layout.kind).toBe('apartment')
    expect(plan.rooms.filter((r) => r.kind === 'bedroom').length).toBe(1)
    expect(plan.rooms.filter((r) => r.kind === 'masterBedroom').length).toBe(1)
    expect(plan.rooms.filter((r) => r.kind === 'bathroom').length).toBe(2)
  })
})

describe('planToZones & buildResidencePreset', () => {
  it('creates world zones with valid bounds', () => {
    const orientation = resolveOrientation('south')
    const plan = buildResidencePlan({
      areaSqm: 80,
      bedrooms: 1,
      bathrooms: 1,
      unitType: '1+1',
      orientation,
    })
    const zones = planToZones(plan)
    expect(zones.length).toBe(plan.rooms.length)
    const firstZone = zones[0]
    expect(firstZone).toBeDefined()
    if (firstZone?.bounds) {
      expect(firstZone.name).toBeDefined()
      expect(firstZone.bounds.maxX).toBeGreaterThan(firstZone.bounds.minX)
    }
  })

  it('builds world preset structure', () => {
    const orientation = resolveOrientation('south')
    const plan = buildResidencePlan({
      areaSqm: 75,
      bedrooms: 1,
      bathrooms: 1,
      unitType: '1+1',
      orientation,
    })
    const preset = buildResidencePreset(plan)
    expect(preset.id).toBe('preset-residence-tour')
    expect(preset.type).toBe('residence')
    expect(preset.zones.length).toBeGreaterThan(0)
    expect(typeof preset.buildScene).toBe('function')
  })
})

describe('room utilities', () => {
  it('computes roomArea accurately', () => {
    const area = roomArea({ cx: 0, cz: 0, w: 4.5, d: 3.2, id: 'test', kind: 'living' })
    expect(area).toBe(14.4)
  })

  it('formats roomDisplayName with numbering for secondary rooms', () => {
    expect(roomDisplayName('bedroom', 'Yatak Odası', 1)).toBe('Yatak Odası')
    expect(roomDisplayName('bedroom', 'Yatak Odası', 2)).toBe('Yatak Odası 2')
    expect(roomDisplayName('living', 'Salon', 2)).toBe('Salon')
  })
})
