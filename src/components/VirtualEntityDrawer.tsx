import { type ReactNode, useEffect } from 'react'
import { X, Clock, FileText, Send, Zap } from 'lucide-react'
import type { WorldEntity } from '../core/types'
import { type LabelOverrides, formatTemplate, mergeLabels } from './labels'

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

export interface VirtualEntityDrawerLabels {
  close: string
  deskTag: string
  workStatus: string
  statusWorking: string
  statusAwaiting: string
  statusIdle: string
  totalMissions: string
  successRate: string
  cost: string
  latestMission: string
  summaryPrefix: string
  viewReport: string
  noMission: string
  dispatchTitle: string
  dispatchPlaceholder: string
}

export const DEFAULT_VIRTUAL_ENTITY_DRAWER_LABELS: Readonly<VirtualEntityDrawerLabels> =
  Object.freeze({
    close: 'Close (Esc)',
    deskTag: 'Desk #{pin}',
    workStatus: 'Work status',
    statusWorking: '⚡ Working on a mission',
    statusAwaiting: '⏳ Awaiting approval',
    statusIdle: '✓ Idle / ready for a mission',
    totalMissions: 'Total missions',
    successRate: 'Success rate',
    cost: 'Cost (last 24h)',
    latestMission: 'Latest / active mission',
    summaryPrefix: 'Summary: ',
    viewReport: 'View output report',
    noMission: 'No mission has been run at this desk yet.',
    dispatchTitle: 'Assign a mission to this desk',
    dispatchPlaceholder: 'e.g. Draft the new campaign copy...',
  })

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
  labels?: LabelOverrides<VirtualEntityDrawerLabels>
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
  labels,
}: VirtualEntityDrawerProps): ReactNode {
  const t = mergeLabels(DEFAULT_VIRTUAL_ENTITY_DRAWER_LABELS, labels)

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
      <div
        className="wv-drawer-header-banner"
        style={{ backgroundColor: entity.avatarColor || '#3b82f6' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="wv-drawer-close-btn"
          title={t.close}
        >
          <X size={16} />
        </button>

        <div className="wv-drawer-meta-tags">
          {entity.pinNumber && (
            <span className="wv-drawer-pin-tag">
              {formatTemplate(t.deskTag, { pin: entity.pinNumber })}
            </span>
          )}
          {entity.department && (
            <span className="wv-drawer-dept-tag">{entity.department}</span>
          )}
        </div>

        <h3 className="wv-drawer-title">{entity.name}</h3>
        <p className="wv-drawer-role">{entity.role || entity.description}</p>
      </div>

      <div className="wv-drawer-body">
        <div className="wv-drawer-status-card">
          <span className="wv-drawer-status-label">{t.workStatus}</span>
          <span className={`wv-drawer-status-chip ${isRunning ? 'is-running' : isAwaiting ? 'is-awaiting' : 'is-idle'}`}>
            {isRunning
              ? t.statusWorking
              : isAwaiting
                ? t.statusAwaiting
                : t.statusIdle}
          </span>
        </div>

        {metrics && (
          <div className="wv-drawer-metrics-grid">
            <div className="wv-drawer-metric-cell">
              <div className="wv-metric-val">{metrics.totalRuns}</div>
              <div className="wv-metric-lbl">{t.totalMissions}</div>
            </div>
            <div className="wv-drawer-metric-cell">
              <div className="wv-metric-val is-success">
                {metrics.successRate !== undefined ? `${Math.round(metrics.successRate)}%` : '100%'}
              </div>
              <div className="wv-metric-lbl">{t.successRate}</div>
            </div>
            <div className="wv-drawer-metric-cell">
              <div className="wv-metric-val">
                ${metrics.costUsd !== undefined ? metrics.costUsd.toFixed(3) : '0.000'}
              </div>
              <div className="wv-metric-lbl">{t.cost}</div>
            </div>
          </div>
        )}

        {latestTask ? (
          <div className="wv-drawer-task-section">
            <div className="wv-task-header">
              <span className="wv-task-title">{t.latestMission}</span>
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
                  <strong>{t.summaryPrefix}</strong>
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
                  <span>{t.viewReport}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="wv-drawer-empty-task">
            <Clock size={20} className="wv-empty-icon" />
            <p>{t.noMission}</p>
          </div>
        )}

        {onDispatch && onChangeDispatchPrompt && (
          <div className="wv-drawer-dispatch-section">
            <span className="wv-dispatch-title">{t.dispatchTitle}</span>
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
                placeholder={t.dispatchPlaceholder}
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
