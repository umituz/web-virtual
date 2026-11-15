import { type ReactNode, useEffect } from 'react'
import { X, Focus } from 'lucide-react'
import type { WorldEntity } from '../core/types'

export interface EntityInspectorProps {
  entity: WorldEntity | null
  onClose: () => void
  onFocusEntity?: (entity: WorldEntity) => void
  renderCustomActions?: (entity: WorldEntity) => ReactNode
  renderCustomContent?: (entity: WorldEntity) => ReactNode
}

export function EntityInspector({
  entity,
  onClose,
  onFocusEntity,
  renderCustomActions,
  renderCustomContent,
}: EntityInspectorProps): ReactNode {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!entity) return null

  const isRunning = entity.status === 'running' || entity.status === 'working'

  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        left: 14,
        width: 320,
        maxHeight: 'calc(100% - 28px)',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: 12,
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#f8fafc',
        fontFamily: 'inherit',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 999,
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            {entity.pinNumber ? `#${entity.pinNumber}` : entity.type.toUpperCase()}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{entity.name}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
          }}
          title="Close (Esc)"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Role & Department */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{entity.role || 'Entity'}</div>
          {entity.department && (
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              Department: {entity.department}
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 8,
            backgroundColor: isRunning ? 'rgba(59, 130, 246, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            border: `1px solid ${isRunning ? 'rgba(59, 130, 246, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
            alignSelf: 'flex-start',
          }}
        >
          <span className={`wv-status-pip ${entity.status || 'idle'}`} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: isRunning ? '#60a5fa' : '#4ade80',
              textTransform: 'capitalize',
            }}
          >
            {entity.status === 'running' || entity.status === 'working'
              ? 'Working on a mission'
              : entity.status === 'awaiting_approval'
                ? 'Awaiting approval'
                : 'Ready / idle'}
          </span>
        </div>

        {/* Description */}
        {entity.description && (
          <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.45, margin: 0 }}>
            {entity.description}
          </p>
        )}

        {/* Custom Application Content */}
        {renderCustomContent && renderCustomContent(entity)}

        {/* Metadata items if present */}
        {entity.metadata && Object.keys(entity.metadata).length > 0 && (
          <div
            style={{
              padding: 10,
              borderRadius: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: 11,
            }}
          >
            <div style={{ fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>ATTRIBUTES</div>
            {Object.entries(entity.metadata).map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '3px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <span style={{ color: '#94a3b8' }}>{k}:</span>
                <span style={{ color: '#f1f5f9', fontWeight: 500 }}>
                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div
        style={{
          padding: 12,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {onFocusEntity && (
          <button
            type="button"
            onClick={() => onFocusEntity(entity)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              width: '100%',
              height: 32,
              borderRadius: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Focus size={14} />
            Focus 3D camera
          </button>
        )}

        {renderCustomActions && renderCustomActions(entity)}
      </div>
    </div>
  )
}
