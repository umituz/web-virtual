import { type ReactNode, useState } from 'react'
import { Send, Sparkles, Bot, Loader2, ChevronDown } from 'lucide-react'
import type { WorldEntity } from '../core/types'

export interface PresetMission {
  label: string
  prompt: string
}

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
  placeholder = "Assign a mission to the general manager or a specialist... (Enter to send)",
  className = '',
}: VirtualCommandBarProps): ReactNode {
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
        aria-label="Open mission panel"
      >
        <Send size={14} color="#3b82f6" />
        <span>⚡ Mission Panel ▲</span>
      </button>
    )
  }

  return (
    <div className={`wv-command-bar-wrapper ${className}`}>
      {/* Preset Missions Carousel / Chips */}
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
            title="Collapse mission panel"
          >
            Hide ▼
          </button>
        </div>
      )}

      {/* Main Command Input Box */}
      <div className="wv-command-box">
        {/* Target Entity Selector */}
        <div className="wv-target-selector-wrapper">
          <select
            value={targetEntityId}
            onChange={(e) => onChangeTarget(e.target.value)}
            className="wv-target-select"
          >
            <option value="auto">👑 General Manager (auto-delegate)</option>
            {entities.length > 0 && (
              <optgroup label="Office desks / staff">
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

        {/* Prompt Input */}
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
          placeholder={placeholder}
          className="wv-prompt-input"
        />

        {/* Fast Demo / Real AI Toggle */}
        {onToggleDemoMode && (
          <button
            type="button"
            onClick={onToggleDemoMode}
            className={`wv-demo-toggle-btn ${isDemoMode ? 'is-demo' : 'is-ai'}`}
            title="Execution mode"
          >
            {isDemoMode ? <Sparkles size={14} /> : <Bot size={14} />}
            <span className="wv-demo-label">{isDemoMode ? 'Fast demo' : 'Real AI'}</span>
          </button>
        )}

        {/* Submit / Dispatch Button */}
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
              <span>Launch</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
