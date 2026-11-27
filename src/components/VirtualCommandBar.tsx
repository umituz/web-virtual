import { type ReactNode, useState } from 'react'
import { Send, Sparkles, Bot, Loader2, ChevronDown } from 'lucide-react'
import type { WorldEntity } from '../core/types'
import { type LabelOverrides, mergeLabels } from './labels'

export interface PresetMission {
  label: string
  prompt: string
}

export interface VirtualCommandBarLabels {
  openPanel: string
  panelCollapsed: string
  collapseTitle: string
  collapseShort: string
  generalManager: string
  desksOptgroup: string
  executionMode: string
  fastDemo: string
  realAI: string
  launch: string
  defaultPlaceholder: string
}

export const DEFAULT_VIRTUAL_COMMAND_BAR_LABELS: Readonly<VirtualCommandBarLabels> = Object.freeze({
  openPanel: 'Open mission panel',
  panelCollapsed: '⚡ Mission Panel ▲',
  collapseTitle: 'Collapse mission panel',
  collapseShort: 'Hide ▼',
  generalManager: '👑 General Manager (auto-delegate)',
  desksOptgroup: 'Office desks / staff',
  executionMode: 'Execution mode',
  fastDemo: 'Fast demo',
  realAI: 'Real AI',
  launch: 'Launch',
  defaultPlaceholder: 'Assign a mission to the general manager or a specialist... (Enter to send)',
})

export interface VirtualCommandBarProps {
  presetMissions?: PresetMission[]
  entities?: WorldEntity[]
  targetEntityId: string
  onChangeTarget: (id: string) => void
  prompt: string
  onChangePrompt: (prompt: string) => void
  onDispatch: () => void
  isDemoMode?: boolean
  onToggleDemoMode?: () => void
  isLaunching?: boolean
  defaultOpen?: boolean
  isOpen?: boolean
  onToggleOpen?: (open: boolean) => void
  placeholder?: string
  className?: string
  labels?: LabelOverrides<VirtualCommandBarLabels>
}

export function VirtualCommandBar({
  presetMissions = [],
  entities = [],
  targetEntityId,
  onChangeTarget,
  prompt,
  onChangePrompt,
  onDispatch,
  isDemoMode = true,
  onToggleDemoMode,
  isLaunching = false,
  defaultOpen = false,
  isOpen: externalIsOpen,
  onToggleOpen,
  placeholder,
  className = '',
  labels,
}: VirtualCommandBarProps): ReactNode {
  const t = mergeLabels(DEFAULT_VIRTUAL_COMMAND_BAR_LABELS, labels)

  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen)
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen

  const handleToggle = (open: boolean) => {
    setInternalIsOpen(open)
    if (onToggleOpen) onToggleOpen(open)
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => handleToggle(true)}
        className="wv-command-collapsed-btn"
        aria-label={t.openPanel}
      >
        <Send size={14} color="#3b82f6" />
        <span>{t.panelCollapsed}</span>
      </button>
    )
  }

  return (
    <div className={`wv-command-bar-wrapper ${className}`}>
      {presetMissions.length > 0 && (
        <div className="wv-command-presets-row">
          <div className="wv-command-presets-scroll">
            {presetMissions.map((pm, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChangePrompt(pm.prompt)}
                className="wv-preset-chip"
              >
                {pm.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleToggle(false)}
            className="wv-collapse-btn"
            title={t.collapseTitle}
          >
            {t.collapseShort}
          </button>
        </div>
      )}

      <div className="wv-command-box">
        <div className="wv-target-selector-wrapper">
          <select
            value={targetEntityId}
            onChange={(e) => onChangeTarget(e.target.value)}
            className="wv-target-select"
          >
            <option value="auto">{t.generalManager}</option>
            {entities.length > 0 && (
              <optgroup label={t.desksOptgroup}>
                {entities.map((en) => (
                  <option key={en.id} value={en.id}>
                    {en.pinNumber ? `#${en.pinNumber} ` : ''}
                    {en.name} {en.role ? `(${en.role})` : ''}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <ChevronDown size={14} className="wv-select-chevron" />
        </div>

        <input
          type="text"
          value={prompt}
          onChange={(e) => onChangePrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onDispatch()
            }
          }}
          placeholder={placeholder ?? t.defaultPlaceholder}
          className="wv-prompt-input"
        />

        {onToggleDemoMode && (
          <button
            type="button"
            onClick={onToggleDemoMode}
            className={`wv-demo-toggle-btn ${isDemoMode ? 'is-demo' : 'is-ai'}`}
            title={t.executionMode}
          >
            {isDemoMode ? <Sparkles size={14} /> : <Bot size={14} />}
            <span className="wv-demo-label">{isDemoMode ? t.fastDemo : t.realAI}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onDispatch}
          disabled={isLaunching || !prompt.trim()}
          className="wv-dispatch-btn"
        >
          {isLaunching ? (
            <Loader2 size={16} className="wv-spin" />
          ) : (
            <>
              <Send size={14} style={{ marginRight: 6 }} />
              <span>{t.launch}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
