import { describe, expect, it } from 'vitest'
import { type LabelOverrides, formatTemplate, mergeLabels } from './labels'
import {
  DEFAULT_DIGITAL_HQ_LABELS,
  type DigitalHQLabels,
} from './DigitalHQView'
import { DEFAULT_WORLD_CONTROLS_LABELS } from './WorldControls'
import { DEFAULT_ENTITY_INSPECTOR_LABELS } from './EntityInspector'
import { DEFAULT_VIRTUAL_ROSTER_LABELS } from './VirtualRoster'
import { DEFAULT_VIRTUAL_COMMAND_BAR_LABELS } from './VirtualCommandBar'
import { DEFAULT_VIRTUAL_REPORT_MODAL_LABELS } from './VirtualReportModal'
import { DEFAULT_VIRTUAL_ENTITY_DRAWER_LABELS } from './VirtualEntityDrawer'
import { DEFAULT_VIRTUAL_WORLD_LABELS } from './VirtualWorld'

describe('formatTemplate', () => {
  it('interpolates single-brace tokens', () => {
    expect(formatTemplate('{count} on a mission', { count: 3 })).toBe('3 on a mission')
  })

  it('keeps unknown tokens intact', () => {
    expect(formatTemplate('Save {percent}%', { other: 1 })).toBe('Save {percent}%')
  })
})

describe('mergeLabels', () => {
  it('returns defaults when no overrides are given', () => {
    expect(mergeLabels(DEFAULT_WORLD_CONTROLS_LABELS)).toBe(DEFAULT_WORLD_CONTROLS_LABELS)
  })

  it('applies flat overrides and keeps the rest', () => {
    const merged = mergeLabels(DEFAULT_WORLD_CONTROLS_LABELS, { topShort: 'Üst' })
    expect(merged.topShort).toBe('Üst')
    expect(merged.resetCamera).toBe(DEFAULT_WORLD_CONTROLS_LABELS.resetCamera)
  })

  it('deep-merges nested groups without mutating defaults', () => {
    const overrides: LabelOverrides<DigitalHQLabels> = {
      modes: { operations: 'Operasyon' },
      command: { start: 'Başlat' },
    }
    const merged = mergeLabels(DEFAULT_DIGITAL_HQ_LABELS, overrides)
    expect(merged.modes.operations).toBe('Operasyon')
    expect(merged.modes.commandCenter).toBe(DEFAULT_DIGITAL_HQ_LABELS.modes.commandCenter)
    expect(merged.command.start).toBe('Başlat')
    expect(DEFAULT_DIGITAL_HQ_LABELS.modes.operations).toBe('Operations')
  })

  it('ignores undefined overrides', () => {
    const merged = mergeLabels(DEFAULT_WORLD_CONTROLS_LABELS, { topShort: undefined })
    expect(merged.topShort).toBe('Top')
  })
})

describe('label catalogs', () => {
  it('template defaults carry their interpolation tokens', () => {
    expect(DEFAULT_DIGITAL_HQ_LABELS.header.desksStaffed).toContain('{staffed}')
    expect(DEFAULT_DIGITAL_HQ_LABELS.header.desksStaffed).toContain('{capacity}')
    expect(DEFAULT_DIGITAL_HQ_LABELS.actions.roster).toContain('{count}')
    expect(DEFAULT_VIRTUAL_ENTITY_DRAWER_LABELS.deskTag).toContain('{pin}')
    expect(DEFAULT_ENTITY_INSPECTOR_LABELS.department).toContain('{department}')
    expect(DEFAULT_VIRTUAL_WORLD_LABELS.environmentAria).toContain('{name}')
  })

  it('defaults are frozen', () => {
    expect(Object.isFrozen(DEFAULT_WORLD_CONTROLS_LABELS)).toBe(true)
    expect(Object.isFrozen(DEFAULT_VIRTUAL_ROSTER_LABELS)).toBe(true)
    expect(Object.isFrozen(DEFAULT_VIRTUAL_COMMAND_BAR_LABELS)).toBe(true)
    expect(Object.isFrozen(DEFAULT_VIRTUAL_REPORT_MODAL_LABELS)).toBe(true)
    expect(Object.isFrozen(DEFAULT_VIRTUAL_ENTITY_DRAWER_LABELS)).toBe(true)
    expect(Object.isFrozen(DEFAULT_VIRTUAL_WORLD_LABELS)).toBe(true)
    expect(Object.isFrozen(DEFAULT_DIGITAL_HQ_LABELS)).toBe(true)
  })

  it('covers every visible string the components render', () => {
    expect(Object.keys(DEFAULT_VIRTUAL_ROSTER_LABELS)).toHaveLength(5)
    expect(Object.keys(DEFAULT_VIRTUAL_COMMAND_BAR_LABELS)).toHaveLength(11)
    expect(Object.keys(DEFAULT_VIRTUAL_REPORT_MODAL_LABELS)).toHaveLength(6)
    expect(Object.keys(DEFAULT_VIRTUAL_ENTITY_DRAWER_LABELS)).toHaveLength(15)
    expect(Object.keys(DEFAULT_VIRTUAL_WORLD_LABELS)).toHaveLength(6)
    expect(Object.keys(DEFAULT_ENTITY_INSPECTOR_LABELS)).toHaveLength(8)
    expect(Object.keys(DEFAULT_DIGITAL_HQ_LABELS.header)).toHaveLength(5)
    expect(Object.keys(DEFAULT_DIGITAL_HQ_LABELS.actions)).toHaveLength(21)
    expect(Object.keys(DEFAULT_DIGITAL_HQ_LABELS.canvas)).toHaveLength(5)
    expect(Object.keys(DEFAULT_DIGITAL_HQ_LABELS.operations)).toHaveLength(15)
    expect(Object.keys(DEFAULT_DIGITAL_HQ_LABELS.command)).toHaveLength(9)
  })
})
