import { type ReactNode } from 'react'
import {
  Users,
  Search,
  X,
  ChevronRight,
  Briefcase,
  Palette,
  Megaphone,
  Globe,
  Shield,
} from 'lucide-react'
import type { WorldEntity, DepartmentInfo } from '../core/types'
import { type LabelOverrides, formatTemplate, mergeLabels } from './labels'

export interface VirtualRosterLabels {
  subheading: string
  close: string
  searchPlaceholder: string
  all: string
  staffFallback: string
}

export const DEFAULT_VIRTUAL_ROSTER_LABELS: Readonly<VirtualRosterLabels> = Object.freeze({
  subheading: '{count} {plural} at their desks',
  close: 'Hide roster panel',
  searchPlaceholder: 'Search by name or role...',
  all: 'All',
  staffFallback: 'Staff member',
})

export interface VirtualRosterProps {
  entities: WorldEntity[]
  departments?: DepartmentInfo[]
  selectedEntityId?: string | null
  onSelectEntity: (id: string) => void
  onClose: () => void
  searchQuery: string
  onSearchChange: (q: string) => void
  selectedCategory: string
  onSelectCategory: (cat: string) => void
  title?: string
  className?: string
  labels?: LabelOverrides<VirtualRosterLabels>
}

export function VirtualRoster({
  entities,
  departments = [],
  selectedEntityId,
  onSelectEntity,
  onClose,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  title = 'Office roster',
  className = '',
  labels,
}: VirtualRosterProps): ReactNode {
  const t = mergeLabels(DEFAULT_VIRTUAL_ROSTER_LABELS, labels)

  const filtered = entities.filter((en) => {
    const nameMatch = en.name.toLowerCase().includes(searchQuery.toLowerCase())
    const roleMatch = (en.role || '').toLowerCase().includes(searchQuery.toLowerCase())
    if (searchQuery && !nameMatch && !roleMatch) return false

    if (selectedCategory !== 'all') {
      const dept = departments.find((d) => (d.slug ?? d.id) === selectedCategory)
      if (dept) {
        if (!(dept.slotIds ?? []).includes(en.id)) return false
      } else if (en.department !== selectedCategory && en.zoneId !== selectedCategory) {
        return false
      }
    }
    return true
  })

  const getCategoryIcon = (slug?: string) => {
    switch (slug) {
      case 'management':
      case 'executive':
        return <Briefcase size={14} />
      case 'creative':
        return <Palette size={14} />
      case 'marketing':
      case 'growth':
        return <Megaphone size={14} />
      case 'tech':
        return <Globe size={14} />
      default:
        return <Shield size={14} />
    }
  }

  return (
    <aside className={`wv-roster-sidebar ${className}`} role="complementary" aria-label={title}>
      <div className="wv-roster-header">
        <div className="wv-roster-title-row">
          <div className="wv-roster-title-group">
            <div className="wv-roster-icon-badge">
              <Users size={16} />
            </div>
            <div>
              <h3 className="wv-roster-heading">{title}</h3>
              <p className="wv-roster-subheading">
                {formatTemplate(t.subheading, {
                  count: entities.length,
                  plural: entities.length === 1 ? 'member' : 'members',
                })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="wv-roster-close-btn"
            title={t.close}
          >
            <X size={16} />
          </button>
        </div>

        <div className="wv-roster-search-wrapper">
          <Search size={14} className="wv-roster-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="wv-roster-search-input"
          />
        </div>

        {departments.length > 0 && (
          <div className="wv-roster-filter-row">
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className={`wv-roster-pill ${selectedCategory === 'all' ? 'is-active' : ''}`}
            >
              {t.all}
            </button>
            {departments.map((dept) => (
              <button
                key={dept.id}
                type="button"
                onClick={() => onSelectCategory(dept.slug ?? dept.id)}
                className={`wv-roster-pill ${selectedCategory === dept.slug ? 'is-active' : ''}`}
              >
                {dept.name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="wv-roster-list">
        {filtered.map((en) => {
          const isSelected = selectedEntityId === en.id
          const isRunning = en.status === 'running' || en.status === 'working'
          const isAwaiting = en.status === 'awaiting_approval'

          return (
            <div
              key={en.id}
              onClick={() => onSelectEntity(en.id)}
              className={`wv-roster-item ${isSelected ? 'is-selected' : ''}`}
            >
              <div className="wv-roster-item-left">
                <div
                  className="wv-roster-avatar-dot"
                  style={{ backgroundColor: en.avatarColor || '#3b82f6' }}
                >
                  {getCategoryIcon(en.department || en.zoneId)}
                  <span
                    className={`wv-roster-status-pip ${
                      isRunning
                        ? 'is-running'
                        : isAwaiting
                          ? 'is-awaiting'
                          : en.status || 'idle'
                    }`}
                  />
                </div>

                <div className="wv-roster-item-info">
                  <div className="wv-roster-name-row">
                    {en.pinNumber && <span className="wv-roster-pin">#{en.pinNumber}</span>}
                    <h4 className="wv-roster-name">{en.name}</h4>
                  </div>
                  <p className="wv-roster-role">{en.role || en.description || t.staffFallback}</p>
                </div>
              </div>

              <ChevronRight size={14} className="wv-roster-chevron" />
            </div>
          )
        })}
      </div>
    </aside>
  )
}
