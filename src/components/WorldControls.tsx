import type { ReactNode } from 'react'
import {
  Sun,
  Moon,
  RotateCcw,
  Compass,
  Maximize2,
  Minimize2,
  Tag,
  MapPin,
  EyeOff,
} from 'lucide-react'
import type { PinDisplayMode } from '../core/types'
import type { CameraPresetName } from '../engine/camera'

export interface WorldControlsProps {
  nightMode: boolean
  onToggleNightMode: () => void
  pinMode: PinDisplayMode
  onChangePinMode: (mode: PinDisplayMode) => void
  onSelectCameraPreset: (preset: CameraPresetName) => void
  onResetCamera: () => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  fps?: number
}

export function WorldControls({
  nightMode,
  onToggleNightMode,
  pinMode,
  onChangePinMode,
  onSelectCameraPreset,
  onResetCamera,
  isFullscreen,
  onToggleFullscreen,
  fps,
}: WorldControlsProps): ReactNode {
  return (
    <div className="wv-controls-toolbar" role="toolbar" aria-label="3D view controls">
      {/* Camera Presets */}
      <button
        type="button"
        className="wv-btn wv-btn-icon"
        title="Isometric view"
        onClick={() => onSelectCameraPreset('isometric')}
      >
        <Compass size={16} />
      </button>

      <button
        type="button"
        className="wv-btn"
        title="Top-down view"
        onClick={() => onSelectCameraPreset('top')}
      >
        Top
      </button>

      <button
        type="button"
        className="wv-btn wv-btn-icon"
        title="Reset camera"
        onClick={onResetCamera}
      >
        <RotateCcw size={15} />
      </button>

      <div className="wv-divider" />

      {/* Pin Mode Toggle */}
      <button
        type="button"
        className={`wv-btn ${pinMode === 'pins' ? 'is-active' : ''}`}
        title="Minimal pins (numbers)"
        onClick={() => onChangePinMode('pins')}
      >
        <MapPin size={14} style={{ marginRight: 4 }} />
        Pins
      </button>

      <button
        type="button"
        className={`wv-btn ${pinMode === 'labels' ? 'is-active' : ''}`}
        title="Detailed label cards"
        onClick={() => onChangePinMode('labels')}
      >
        <Tag size={14} style={{ marginRight: 4 }} />
        Labels
      </button>

      <button
        type="button"
        className={`wv-btn wv-btn-icon ${pinMode === 'off' ? 'is-active' : ''}`}
        title="Hide labels"
        onClick={() => onChangePinMode('off')}
      >
        <EyeOff size={15} />
      </button>

      <div className="wv-divider" />

      {/* Day / Night Toggle */}
      <button
        type="button"
        className="wv-btn wv-btn-icon"
        title={nightMode ? 'Switch to day mode' : 'Switch to night mode'}
        onClick={onToggleNightMode}
      >
        {nightMode ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} />}
      </button>

      {/* Fullscreen Toggle */}
      {onToggleFullscreen && (
        <button
          type="button"
          className="wv-btn wv-btn-icon"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      )}

      {/* FPS Counter */}
      {fps !== undefined && (
        <>
          <div className="wv-divider" />
          <span
            style={{
              fontSize: 10,
              fontFamily: 'monospace',
              color: fps >= 55 ? '#4ade80' : fps >= 30 ? '#facc15' : '#f87171',
              padding: '0 6px',
            }}
          >
            {fps} FPS
          </span>
        </>
      )}
    </div>
  )
}
