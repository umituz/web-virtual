import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { MonitorOff, RotateCw } from 'lucide-react'
import * as THREE from 'three'
import type {
  WorldDefinition,
  WorldEntity,
  WorldPreset,
  PinDisplayMode,
  WorldTickFn,
  UnregisterTick,
  WorldTourConfig,
} from '../core/types'
import { WorldEngine } from '../engine/renderer'
import { createStylizedAvatar, type CreatedAvatar } from '../entities/people/AvatarBuilder'
import { EntityPins } from './EntityPins'
import { WorldControls, type WorldControlsLabels } from './WorldControls'
import { EntityInspector, type EntityInspectorLabels } from './EntityInspector'
import { type LabelOverrides, formatTemplate, mergeLabels } from './labels'
import type { CameraPresetName } from '../engine/camera'

export interface VirtualWorldRef {
  focusOnEntity: (entityId: string) => void
  setCameraPreset: (preset: CameraPresetName) => void
  resetCamera: () => void
  setNightMode: (isNight: boolean) => void
  resize: () => void
  registerTick: (fn: WorldTickFn) => UnregisterTick
  setTour: (config: WorldTourConfig | null) => void
}

export interface VirtualWorldLabels {
  environmentAria: string
  webglUnavailableTitle: string
  webglUnavailableCopy: string
  contextLostTitle: string
  contextLostCopy: string
  restore: string
}

export const DEFAULT_VIRTUAL_WORLD_LABELS: Readonly<VirtualWorldLabels> = Object.freeze({
  environmentAria: '{name} 3D environment',
  webglUnavailableTitle: '3D view unavailable',
  webglUnavailableCopy:
    'Your browser or device does not support WebGL, which is required for the 3D environment. Entity data remains available below.',
  contextLostTitle: '3D view interrupted',
  contextLostCopy: 'The graphics context was lost (usually a GPU or tab reset). Restore it below.',
  restore: 'Restore 3D view',
})

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
  onTourStopChange?: (stopIndex: number | null) => void
  labels?: LabelOverrides<VirtualWorldLabels>
  controlsLabels?: LabelOverrides<WorldControlsLabels>
  inspectorLabels?: LabelOverrides<EntityInspectorLabels>
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
      onTourStopChange,
      labels,
      controlsLabels,
      inspectorLabels,
    },
    ref,
  ): ReactNode {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const engineRef = useRef<WorldEngine | null>(null)
    const pinElementsRef = useRef<Map<string, HTMLElement>>(new Map())

    const avatarRegistryRef = useRef<Map<string, CreatedAvatar>>(new Map())
    const avatarGroupRef = useRef<THREE.Group | null>(null)
    const staticInteractivesRef = useRef<THREE.Object3D[]>([])

    const worldRef = useRef(world)
    const nightModeRef = useRef(false)
    const tourConfigRef = useRef<WorldTourConfig | null>(null)
    const callbacksRef = useRef({
      onSelectEntity: (_entity: WorldEntity | null) => {},
      onHoverEntity: (_entity: WorldEntity | null) => {},
      onTourStopChange: (_stopIndex: number | null) => {},
    })

    const [internalNightMode, setInternalNightMode] = useState(false)
    const [internalPinMode, setInternalPinMode] = useState<PinDisplayMode>(defaultPinMode)
    const [fps, setFps] = useState<number>(60)
    const [internalSelectedEntity, setInternalSelectedEntity] = useState<WorldEntity | null>(null)

    const [webglFailed, setWebglFailed] = useState(false)
    const [contextLost, setContextLost] = useState(false)
    const [engineEpoch, setEngineEpoch] = useState(0)

    const t = mergeLabels(DEFAULT_VIRTUAL_WORLD_LABELS, labels)
    const environmentAria = formatTemplate(t.environmentAria, { name: world.name })

    const nightMode = externalNightMode !== undefined ? externalNightMode : internalNightMode
    const pinMode = externalPinMode !== undefined ? externalPinMode : internalPinMode
    useEffect(() => {
      nightModeRef.current = nightMode
      worldRef.current = world
    })

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

    useEffect(() => {
      callbacksRef.current = {
        onSelectEntity: handleSelectEntity,
        onHoverEntity: onHoverEntity || (() => {}),
        onTourStopChange: onTourStopChange || (() => {}),
      }
    })

    const handleRegisterPinElement = useCallback((entityId: string, el: HTMLElement | null) => {
      if (el) {
        pinElementsRef.current.set(entityId, el)
      } else {
        pinElementsRef.current.delete(entityId)
      }
    }, [])

    useEffect(() => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      let engine: WorldEngine
      try {
        engine = new WorldEngine({
          canvas,
          world: worldRef.current,
          pinElements: pinElementsRef.current,
          onSelectEntity: (evt) => callbacksRef.current.onSelectEntity(evt.entity),
          onHoverEntity: (entity) => callbacksRef.current.onHoverEntity(entity),
          onFpsUpdate: (currentFps) => {
            setFps(currentFps)
          },
          onContextLost: () => setContextLost(true),
        })
      } catch (err) {
        console.error('[web-virtual] WebGL is unavailable, rendering fallback UI:', err)
        setWebglFailed(true)
        return
      }

      engineRef.current = engine
      setWebglFailed(false)
      setContextLost(false)
      const avatarRegistry = avatarRegistryRef.current

      const activePreset = preset
      if (activePreset && activePreset.buildScene) {
        activePreset.buildScene(engine.scene, {
          nightMode: nightModeRef.current,
          theme: worldRef.current.theme,
          registerTick: engine.registerTick.bind(engine),
        })
      }

      const avatarGroup = new THREE.Group()
      avatarGroup.name = 'world-avatars'
      engine.scene.add(avatarGroup)
      avatarGroupRef.current = avatarGroup

      const staticInteractives: THREE.Object3D[] = []
      engine.scene.traverse((obj) => {
        if (obj.userData && obj.userData.entityId) {
          staticInteractives.push(obj)
        }
      })
      staticInteractivesRef.current = staticInteractives
      engine.interactiveObjects = [...staticInteractives]

      const pendingTour = tourConfigRef.current
      if (pendingTour) {
        engine.startTour(pendingTour, (index) => callbacksRef.current.onTourStopChange(index))
      }

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
        avatarRegistry.clear()
        avatarGroupRef.current = null
        staticInteractivesRef.current = []
        engine.dispose()
        engineRef.current = null
      }
    }, [preset, engineEpoch])

    useEffect(() => {
      const engine = engineRef.current
      const avatarGroup = avatarGroupRef.current
      if (!engine || !avatarGroup) return

      engine.updateWorld(world)

      const registry = avatarRegistryRef.current
      const seen = new Set<string>()

      for (const entity of world.entities) {
        if (entity.type !== 'person' && entity.type !== 'actor') continue
        seen.add(entity.id)

        const existing = registry.get(entity.id)
        if (existing) {
          existing.update(entity)
          continue
        }

        const created = createStylizedAvatar(entity, engine.materials)
        registry.set(entity.id, created)
        avatarGroup.add(created.group)
      }

      for (const [id, created] of registry) {
        if (!seen.has(id)) {
          created.group.removeFromParent()
          registry.delete(id)
        }
      }

      engine.animators = Array.from(registry.values()).map((a) => a.animate)
      engine.interactiveObjects = [
        ...staticInteractivesRef.current,
        ...Array.from(registry.values()).map((a) => a.group),
      ]
    }, [world, preset, engineEpoch])

    useEffect(() => {
      if (engineRef.current) {
        engineRef.current.setNightMode(nightMode)
      }
    }, [nightMode])

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
        registerTick: (fn: WorldTickFn) => {
          if (engineRef.current) {
            return engineRef.current.registerTick(fn)
          }
          return () => {}
        },
        setTour: (config: WorldTourConfig | null) => {
          tourConfigRef.current = config
          const engine = engineRef.current
          if (!engine) return
          if (config) {
            engine.startTour(config, (index) => callbacksRef.current.onTourStopChange(index))
          } else {
            engine.stopTour()
            callbacksRef.current.onTourStopChange(null)
          }
        },
      }),
      [],
    )

    const handleRestoreContext = useCallback(() => {
      setContextLost(false)
      setEngineEpoch((epoch) => epoch + 1)
    }, [])

    if (webglFailed) {
      return (
        <div
          ref={containerRef}
          className={`wv-container wv-webgl-fallback ${className}`}
          style={style}
          role="region"
          aria-label={environmentAria}
        >
          <div className="wv-fallback-card">
            <MonitorOff size={28} />
            <h3>{t.webglUnavailableTitle}</h3>
            <p>{t.webglUnavailableCopy}</p>
            <ul className="wv-fallback-entity-list">
              {world.entities.slice(0, 12).map((entity) => (
                <li key={entity.id}>
                  <span className={`wv-status-pip ${entity.status || 'idle'}`} />
                  {entity.pinNumber ? `#${entity.pinNumber} ` : ''}
                  {entity.name}
                </li>
              ))}
            </ul>
          </div>
          {children}
        </div>
      )
    }

    return (
      <div
        ref={containerRef}
        className={`wv-container ${nightMode ? 'is-night' : ''} ${className}`}
        style={style}
        role="region"
        aria-label={environmentAria}
      >
        <canvas ref={canvasRef} className="wv-canvas" />

        {contextLost && (
          <div className="wv-context-lost-overlay">
            <div className="wv-fallback-card">
              <RotateCw size={26} />
              <h3>{t.contextLostTitle}</h3>
              <p>{t.contextLostCopy}</p>
              <button type="button" className="wv-fallback-btn" onClick={handleRestoreContext}>
                {t.restore}
              </button>
            </div>
          </div>
        )}

        <EntityPins
          entities={world.entities}
          mode={pinMode}
          selectedEntityId={activeEntity?.id}
          onSelectEntity={handleSelectEntity}
          onRegisterElement={handleRegisterPinElement}
        />

        {showControls && (
          <WorldControls
            nightMode={nightMode}
            onToggleNightMode={handleToggleNightMode}
            pinMode={pinMode}
            onChangePinMode={handlePinModeChange}
            onSelectCameraPreset={handleCameraPreset}
            onResetCamera={handleResetCamera}
            fps={fps}
            labels={controlsLabels}
          />
        )}

        {showInspector && activeEntity && (
          <EntityInspector
            entity={activeEntity}
            onClose={() => handleSelectEntity(null)}
            onFocusEntity={handleFocusEntity}
            renderCustomContent={renderCustomInspectorContent}
            renderCustomActions={renderCustomInspectorActions}
            labels={inspectorLabels}
          />
        )}

        {children}
      </div>
    )
  },
)
