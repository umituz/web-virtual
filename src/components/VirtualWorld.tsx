import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import * as THREE from 'three'
import type {
  WorldDefinition,
  WorldEntity,
  WorldPreset,
  PinDisplayMode,
} from '../core/types'
import { WorldEngine } from '../engine/renderer'
import { createStylizedAvatar } from '../entities/people/AvatarBuilder'
import { EntityPins } from './EntityPins'
import { WorldControls } from './WorldControls'
import { EntityInspector } from './EntityInspector'
import type { CameraPresetName } from '../engine/camera'

export interface VirtualWorldRef {
  focusOnEntity: (entityId: string) => void
  setCameraPreset: (preset: CameraPresetName) => void
  resetCamera: () => void
  setNightMode: (isNight: boolean) => void
  resize: () => void
}

export interface VirtualWorldProps {
  world: WorldDefinition
  preset?: WorldPreset
  selectedEntityId?: string | null
  onSelectEntity?: (entity: WorldEntity | null) => void
  onHoverEntity?: (entity: WorldEntity | null) => void
  defaultPinMode?: PinDisplayMode
  pinMode?: PinDisplayMode
  onChangePinMode?: (mode: PinDisplayMode) => void
  nightMode?: boolean
  onToggleNightMode?: () => void
  showControls?: boolean
  showInspector?: boolean
  className?: string
  style?: React.CSSProperties
  children?: ReactNode
  renderCustomInspectorContent?: (entity: WorldEntity) => ReactNode
  renderCustomInspectorActions?: (entity: WorldEntity) => ReactNode
}

export const VirtualWorld = forwardRef<VirtualWorldRef, VirtualWorldProps>(
  function VirtualWorld(
    {
      world,
      preset,
      selectedEntityId,
      onSelectEntity,
      onHoverEntity,
      defaultPinMode = 'off',
      pinMode: externalPinMode,
      onChangePinMode,
      nightMode: externalNightMode,
      onToggleNightMode: externalToggleNightMode,
      showControls = true,
      showInspector = true,
      className = '',
      style,
      children,
      renderCustomInspectorContent,
      renderCustomInspectorActions,
    },
    ref,
  ): ReactNode {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const engineRef = useRef<WorldEngine | null>(null)
    const pinElementsRef = useRef<Map<string, HTMLElement>>(new Map())

    const [internalNightMode, setInternalNightMode] = useState(false)
    const [internalPinMode, setInternalPinMode] = useState<PinDisplayMode>(defaultPinMode)
    const [fps, setFps] = useState<number>(60)
    const [internalSelectedEntity, setInternalSelectedEntity] = useState<WorldEntity | null>(null)

    const nightMode = externalNightMode !== undefined ? externalNightMode : internalNightMode
    const pinMode = externalPinMode !== undefined ? externalPinMode : internalPinMode

    // Determine active selected entity (controlled or uncontrolled)
    const activeEntity =
      selectedEntityId !== undefined
        ? world.entities.find((e) => e.id === selectedEntityId) || null
        : internalSelectedEntity

    const handleSelectEntity = useCallback(
      (entity: WorldEntity | null) => {
        setInternalSelectedEntity(entity)
        if (onSelectEntity) {
          onSelectEntity(entity)
        }
      },
      [onSelectEntity],
    )

    const handleRegisterPinElement = useCallback((entityId: string, el: HTMLElement | null) => {
      if (el) {
        pinElementsRef.current.set(entityId, el)
      } else {
        pinElementsRef.current.delete(entityId)
      }
    }, [])

    // Initialize Three.js Engine
    useEffect(() => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const engine = new WorldEngine({
        canvas,
        world,
        pinElements: pinElementsRef.current,
        onSelectEntity: (evt) => {
          handleSelectEntity(evt.entity)
        },
        onHoverEntity: (entity) => {
          if (onHoverEntity) onHoverEntity(entity)
        },
        onFpsUpdate: (currentFps) => {
          setFps(currentFps)
        },
      })
      engineRef.current = engine

      // 1. Build environment from preset or custom scene builder
      const activePreset = preset
      if (activePreset && activePreset.buildScene) {
        activePreset.buildScene(engine.scene, {
          nightMode,
          theme: world.theme,
        })
      }

      // 2. Build 3D Avatars for people/actor entities
      const avatarGroup = new THREE.Group()
      avatarGroup.name = 'world-avatars'

      for (const entity of world.entities) {
        if (entity.type === 'person' || entity.type === 'actor') {
          const { group, animate } = createStylizedAvatar(entity, engine.materials)
          avatarGroup.add(group)
          engine.animators.push(animate)
          engine.interactiveObjects.push(group)
        }
      }
      engine.scene.add(avatarGroup)

      // 3. Register all interactive objects with entityId (workstations, chairs, monitors, avatars)
      engine.scene.traverse((obj) => {
        if (obj.userData && obj.userData.entityId) {
          if (!engine.interactiveObjects.includes(obj)) {
            engine.interactiveObjects.push(obj)
          }
        }
      })

      // Resize Observer
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect
          if (width > 0 && height > 0) {
            engine.resize(width, height)
          }
        }
      })
      resizeObserver.observe(container)

      return () => {
        resizeObserver.disconnect()
        engine.dispose()
        engineRef.current = null
        pinElementsRef.current.clear()
      }
    }, [world, preset, handleSelectEntity, onHoverEntity])

    // Sync Night Mode with engine
    useEffect(() => {
      if (engineRef.current) {
        engineRef.current.setNightMode(nightMode)
      }
    }, [nightMode])

    // Handle Night Mode Toggle
    const handleToggleNightMode = useCallback(() => {
      if (externalToggleNightMode) {
        externalToggleNightMode()
      } else {
        setInternalNightMode((prev) => !prev)
      }
    }, [externalToggleNightMode])

    const handlePinModeChange = useCallback(
      (newMode: PinDisplayMode) => {
        setInternalPinMode(newMode)
        if (onChangePinMode) onChangePinMode(newMode)
      },
      [onChangePinMode],
    )

    // Handle Camera Presets
    const handleCameraPreset = useCallback((presetName: CameraPresetName) => {
      if (engineRef.current) {
        engineRef.current.setCameraPreset(presetName)
      }
    }, [])

    const handleResetCamera = useCallback(() => {
      if (engineRef.current) {
        engineRef.current.resetCamera()
      }
    }, [])

    const handleFocusEntity = useCallback((entity: WorldEntity) => {
      if (engineRef.current) {
        engineRef.current.focusOnEntity(entity.id)
      }
    }, [])

    // Imperative API for parent refs
    useImperativeHandle(
      ref,
      () => ({
        focusOnEntity: (id: string) => {
          if (engineRef.current) engineRef.current.focusOnEntity(id)
        },
        setCameraPreset: (presetName: CameraPresetName) => {
          if (engineRef.current) engineRef.current.setCameraPreset(presetName)
        },
        resetCamera: () => {
          if (engineRef.current) engineRef.current.resetCamera()
        },
        setNightMode: (isNight: boolean) => {
          setInternalNightMode(isNight)
          if (engineRef.current) engineRef.current.setNightMode(isNight)
        },
        resize: () => {
          if (engineRef.current && containerRef.current) {
            const { clientWidth, clientHeight } = containerRef.current
            engineRef.current.resize(clientWidth, clientHeight)
          }
        },
      }),
      [],
    )

    return (
      <div
        ref={containerRef}
        className={`wv-container ${nightMode ? 'is-night' : ''} ${className}`}
        style={style}
        role="region"
        aria-label={`${world.name} 3D Sanal Ortamı`}
      >
        <canvas ref={canvasRef} className="wv-canvas" />

        {/* Floating 60fps GPU Projected Pins */}
        <EntityPins
          entities={world.entities}
          mode={pinMode}
          selectedEntityId={activeEntity?.id}
          onSelectEntity={handleSelectEntity}
          onRegisterElement={handleRegisterPinElement}
        />

        {/* Floating View Controls */}
        {showControls && (
          <WorldControls
            nightMode={nightMode}
            onToggleNightMode={handleToggleNightMode}
            pinMode={pinMode}
            onChangePinMode={handlePinModeChange}
            onSelectCameraPreset={handleCameraPreset}
            onResetCamera={handleResetCamera}
            fps={fps}
          />
        )}

        {/* Slide-out Entity Contextual Inspector */}
        {showInspector && activeEntity && (
          <EntityInspector
            entity={activeEntity}
            onClose={() => handleSelectEntity(null)}
            onFocusEntity={handleFocusEntity}
            renderCustomContent={renderCustomInspectorContent}
            renderCustomActions={renderCustomInspectorActions}
          />
        )}

        {/* Consumer UI Overlays (e.g., bottom dispatch bar, top mode switcher) */}
        {children}
      </div>
    )
  },
)
