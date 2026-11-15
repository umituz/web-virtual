import type { ReactNode } from 'react'
import type { WorldEntity, PinDisplayMode } from '../core/types'

export interface EntityPinsProps {
  entities: WorldEntity[]
  mode: PinDisplayMode
  selectedEntityId?: string | null
  onSelectEntity: (entity: WorldEntity) => void
  onRegisterElement: (entityId: string, el: HTMLElement | null) => void
}

export function EntityPins({
  entities,
  mode,
  selectedEntityId,
  onSelectEntity,
  onRegisterElement,
}: EntityPinsProps): ReactNode {
  if (mode === 'off') return null

  return (
    <div className="wv-pins-overlay" aria-hidden="true">
      {entities.map((entity) => {
        const isSelected = selectedEntityId === entity.id
        const isRunning = entity.status === 'running' || entity.status === 'working'
        const pinText = entity.pinNumber ? `#${entity.pinNumber}` : entity.name.slice(0, 3)

        return (
          <div
            key={entity.id}
            ref={(el) => onRegisterElement(entity.id, el)}
            className="wv-pin-anchor"
            style={{ display: 'none' }} // initially hidden until projector places it
          >
            {mode === 'pins' && !isSelected ? (
              <button
                type="button"
                className={`wv-pin-circle ${isSelected ? 'is-selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectEntity(entity)
                }}
                title={`${entity.name} (${entity.role || entity.type})`}
              >
                <span className={`wv-status-pip ${entity.status || 'idle'}`} />
                <span>{pinText}</span>
              </button>
            ) : (
              <button
                type="button"
                className={`wv-pin-chip ${isSelected ? 'is-selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectEntity(entity)
                }}
                title={`${entity.name} (${entity.role || entity.type})`}
              >
                <span className={`wv-status-pip ${entity.status || 'idle'}`} />
                <span style={{ fontWeight: 700, flexShrink: 0 }}>{pinText}</span>
                <span className="wv-pin-label-text">{entity.pinLabel || entity.name}</span>
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
