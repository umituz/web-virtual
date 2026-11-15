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
    <div className="wv-controls-toolbar" role="toolbar" aria-label="3D Görünüm Kontrolleri">
      {/* Camera Presets */}
      <button
        type="button"
        className="wv-btn wv-btn-icon"
        title="İzometrik Görünüm"
        onClick={() => onSelectCameraPreset('isometric')}
      >
        <Compass size={16} />
      </button>

      <button
        type="button"
        className="wv-btn"
        title="Üstten Bakış"
        onClick={() => onSelectCameraPreset('top')}
      >
        Üst
      </button>

      <button
        type="button"
        className="wv-btn wv-btn-icon"
        title="Kamerayı Sıfırla"
        onClick={onResetCamera}
      >
        <RotateCcw size={15} />
      </button>

      <div className="wv-divider" />

      {/* Pin Mode Toggle */}
      <button
        type="button"
        className={`wv-btn ${pinMode === 'pins' ? 'is-active' : ''}`}
        title="Minimal İğneler (Sayılar)"
        onClick={() => onChangePinMode('pins')}
      >
        <MapPin size={14} style={{ marginRight: 4 }} />
        İğneler
      </button>

      <button
        type="button"
        className={`wv-btn ${pinMode === 'labels' ? 'is-active' : ''}`}
        title="Detaylı Kartlar"
        onClick={() => onChangePinMode('labels')}
      >
        <Tag size={14} style={{ marginRight: 4 }} />
        Etiketler
      </button>

      <button
        type="button"
        className={`wv-btn wv-btn-icon ${pinMode === 'off' ? 'is-active' : ''}`}
        title="Etiketleri Gizle"
        onClick={() => onChangePinMode('off')}
      >
        <EyeOff size={15} />
      </button>

      <div className="wv-divider" />

      {/* Day / Night Toggle */}
      <button
        type="button"
        className="wv-btn wv-btn-icon"
        title={nightMode ? 'Gündüz Moduna Geç' : 'Gece Moduna Geç'}
        onClick={onToggleNightMode}
      >
        {nightMode ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} />}
      </button>

      {/* Fullscreen Toggle */}
      {onToggleFullscreen && (
        <button
          type="button"
          className="wv-btn wv-btn-icon"
          title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
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
