import { type ReactNode, useEffect } from 'react'
import { X, Clock, FileText, Send, Zap } from 'lucide-react'
import type { WorldEntity } from '../core/types'

export interface EntityRunMetrics {
  totalRuns: number
  successRate?: number
  costUsd?: number
}

export interface EntityLatestTask {
  prompt: string
  summary?: string | null
  createdAt?: string
  status?: string
}

export interface VirtualEntityDrawerProps {
  entity: WorldEntity | null
  onClose: () => void
  metrics?: EntityRunMetrics
  latestTask?: EntityLatestTask | null
  onViewReport?: () => void
  dispatchPrompt?: string
  onChangeDispatchPrompt?: (val: string) => void
  onDispatch?: () => void
  isDispatching?: boolean
  className?: string
}

export function VirtualEntityDrawer({
  entity,
  onClose,
  metrics,
  latestTask,
  onViewReport,
  dispatchPrompt = '',
  onChangeDispatchPrompt,
  onDispatch,
  isDispatching = false,
  className = '',
}: VirtualEntityDrawerProps): ReactNode {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!entity) return null

  const isRunning = entity.status === 'running' || entity.status === 'working'
  const isAwaiting = entity.status === 'awaiting_approval'

  return (
    <div className={`wv-profile-drawer ${className}`} role="dialog" aria-modal="true">
      {/* Header Banner */}
      <div
        className="wv-drawer-header-banner"
        style={{ backgroundColor: entity.avatarColor || '#3b82f6' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="wv-drawer-close-btn"
          title="Kapat (Esc)"
        >
          <X size={16} />
        </button>

        <div className="wv-drawer-meta-tags">
          {entity.pinNumber && (
            <span className="wv-drawer-pin-tag">Masa #{entity.pinNumber}</span>
          )}
          {entity.department && (
            <span className="wv-drawer-dept-tag">{entity.department}</span>
          )}
        </div>

        <h3 className="wv-drawer-title">{entity.name}</h3>
        <p className="wv-drawer-role">{entity.role || entity.description}</p>
      </div>

      {/* Body Content */}
      <div className="wv-drawer-body">
        {/* Status Row */}
        <div className="wv-drawer-status-card">
          <span className="wv-drawer-status-label">Çalışma Durumu</span>
          <span className={`wv-drawer-status-chip ${isRunning ? 'is-running' : isAwaiting ? 'is-awaiting' : 'is-idle'}`}>
            {isRunning
              ? '⚡ Görev Yürütüyor'
              : isAwaiting
                ? '⏳ Onay Bekliyor'
                : '✓ Boşta / Göreve Hazır'}
          </span>
        </div>

        {/* Metrics Grid */}
        {metrics && (
          <div className="wv-drawer-metrics-grid">
            <div className="wv-drawer-metric-cell">
              <div className="wv-metric-val">{metrics.totalRuns}</div>
              <div className="wv-metric-lbl">Toplam Görev</div>
            </div>
            <div className="wv-drawer-metric-cell">
              <div className="wv-metric-val is-success">
                {metrics.successRate !== undefined ? `${Math.round(metrics.successRate)}%` : '100%'}
              </div>
              <div className="wv-metric-lbl">Başarı Oranı</div>
            </div>
            <div className="wv-drawer-metric-cell">
              <div className="wv-metric-val">
                ${metrics.costUsd !== undefined ? metrics.costUsd.toFixed(3) : '0.000'}
              </div>
              <div className="wv-metric-lbl">Son 24s Maliyet</div>
            </div>
          </div>
        )}

        {/* Current or Latest Task */}
        {latestTask ? (
          <div className="wv-drawer-task-section">
            <div className="wv-task-header">
              <span className="wv-task-title">Son / Aktif Görev</span>
              {latestTask.createdAt && (
                <span className="wv-task-time">
                  {new Date(latestTask.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>

            <div className="wv-task-box">
              <p className="wv-task-prompt">{latestTask.prompt}</p>
              {latestTask.summary && (
                <div className="wv-task-summary">
                  <strong>Özet: </strong>
                  {latestTask.summary}
                </div>
              )}
              {onViewReport && (
                <button
                  type="button"
                  onClick={onViewReport}
                  className="wv-view-report-btn"
                >
                  <FileText size={13} style={{ marginRight: 6 }} />
                  <span>Çıktı Raporunu İncele</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="wv-drawer-empty-task">
            <Clock size={20} className="wv-empty-icon" />
            <p>Henüz bu masada bir görev yürütülmedi.</p>
          </div>
        )}

        {/* Direct Dispatch to this Entity */}
        {onDispatch && onChangeDispatchPrompt && (
          <div className="wv-drawer-dispatch-section">
            <span className="wv-dispatch-title">Doğrudan Bu Masaya Görev Ver</span>
            <div className="wv-dispatch-row">
              <input
                type="text"
                value={dispatchPrompt}
                onChange={(e) => onChangeDispatchPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    onDispatch()
                  }
                }}
                placeholder="Örn: Yeni kampanya metinlerini hazırla..."
                className="wv-dispatch-input"
              />
              <button
                type="button"
                onClick={onDispatch}
                disabled={isDispatching || !dispatchPrompt.trim()}
                className="wv-dispatch-submit-btn"
              >
                {isDispatching ? <Zap size={14} className="wv-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
