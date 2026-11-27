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
import { type LabelOverrides, mergeLabels } from './labels'

export interface WorldControlsLabels {
  toolbar: string
  isometricView: string
  topView: string
  topShort: string
  resetCamera: string
  minimalPins: string
  pinsShort: string
  detailedLabels: string
  labelsShort: string
  hideLabels: string
  switchToDay: string
  switchToNight: string
  exitFullscreen: string
  fullscreen: string
}

export const DEFAULT_WORLD_CONTROLS_LABELS: Readonly<WorldControlsLabels> = Object.freeze({
  toolbar: '3D view controls',
  isometricView: 'Isometric view',
  topView: 'Top-down view',
  topShort: 'Top',
  resetCamera: 'Reset camera',
  minimalPins: 'Minimal pins (numbers)',
  pinsShort: 'Pins',
  detailedLabels: 'Detailed label cards',
  labelsShort: 'Labels',
  hideLabels: 'Hide labels',
  switchToDay: 'Switch to day mode',
  switchToNight: 'Switch to night mode',
  exitFullscreen: 'Exit fullscreen',
  fullscreen: 'Fullscreen',
})

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
  labels?: LabelOverrides<WorldControlsLabels>
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
  labels,
}: WorldControlsProps): ReactNode {
  const t = mergeLabels(DEFAULT_WORLD_CONTROLS_LABELS, labels)

  return (
    <div className="wv-controls-toolbar" role="toolbar" aria-label={t.toolbar}>
      <button
        type="button"
        className="wv-btn wv-btn-icon"
        title={t.isometricView}
        onClick={() => onSelectCameraPreset('isometric')}
      >
        <Compass size={16} />
      </button>

      <button
        type="button"
        className="wv-btn"
        title={t.topView}
        onClick={() => onSelectCameraPreset('top')}
      >
        {t.topShort}
      </button>

      <button
        type="button"
        className="wv-btn wv-btn-icon"
        title={t.resetCamera}
        onClick={onResetCamera}
      >
        <RotateCcw size={15} />
      </button>

      <div className="wv-divider" />

      <button
        type="button"
        className={`wv-btn ${pinMode === 'pins' ? 'is-active' : ''}`}
        title={t.minimalPins}
        onClick={() => onChangePinMode('pins')}
      >
        <MapPin size={14} style={{ marginRight: 4 }} />
        {t.pinsShort}
      </button>

      <button
        type="button"
        className={`wv-btn ${pinMode === 'labels' ? 'is-active' : ''}`}
        title={t.detailedLabels}
        onClick={() => onChangePinMode('labels')}
      >
        <Tag size={14} style={{ marginRight: 4 }} />
        {t.labelsShort}
      </button>

      <button
        type="button"
        className={`wv-btn wv-btn-icon ${pinMode === 'off' ? 'is-active' : ''}`}
        title={t.hideLabels}
        onClick={() => onChangePinMode('off')}
      >
        <EyeOff size={15} />
      </button>

      <div className="wv-divider" />

      <button
        type="button"
        className="wv-btn wv-btn-icon"
        title={nightMode ? t.switchToDay : t.switchToNight}
        onClick={onToggleNightMode}
      >
        {nightMode ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} />}
      </button>

      {onToggleFullscreen && (
        <button
          type="button"
          className="wv-btn wv-btn-icon"
          title={isFullscreen ? t.exitFullscreen : t.fullscreen}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      )}

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
