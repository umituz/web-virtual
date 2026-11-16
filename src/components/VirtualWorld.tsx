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
} from '../core/types'
import { WorldEngine } from '../engine/renderer'
import { createStylizedAvatar, type CreatedAvatar } from '../entities/people/AvatarBuilder'
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
  /**
   * Register a per-frame animation stepped by the engine's render loop —
   * no separate requestAnimationFrame loop needed on the consumer side.
   */
  registerTick: (fn: WorldTickFn) => UnregisterTick
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

    // Hot-sync registry: avatars are created once per entity and updated in place.
    const avatarRegistryRef = useRef<Map<string, CreatedAvatar>>(new Map())
    const avatarGroupRef = useRef<THREE.Group | null>(null)
    const staticInteractivesRef = useRef<THREE.Object3D[]>([])

    // Latest props/refs readable by stable engine callbacks (prevents engine re-init churn)
    const worldRef = useRef(world)
    const nightModeRef = useRef(false)
    const callbacksRef = useRef({
      onSelectEntity: (_entity: WorldEntity | null) => {},
      onHoverEntity: (_entity: WorldEntity | null) => {},
    })

    const [internalNightMode, setInternalNightMode] = useState(false)
    const [internalPinMode, setInternalPinMode] = useState<PinDisplayMode>(defaultPinMode)
    const [fps, setFps] = useState<number>(60)
    const [internalSelectedEntity, setInternalSelectedEntity] = useState<WorldEntity | null>(null)

    // WebGL resilience state
    const [webglFailed, setWebglFailed] = useState(false)
    const [contextLost, setContextLost] = useState(false)
    const [engineEpoch, setEngineEpoch] = useState(0)

    const nightMode = externalNightMode !== undefined ? externalNightMode : internalNightMode
    const pinMode = externalPinMode !== undefined ? externalPinMode : internalPinMode
    nightModeRef.current = nightMode
    worldRef.current = world

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

    // Keep stable engine callbacks pointing at the latest handler identities
    useEffect(() => {
      callbacksRef.current = {
        onSelectEntity: handleSelectEntity,
        onHoverEntity: onHoverEntity || (() => {}),
      }
    })

    const handleRegisterPinElement = useCallback((entityId: string, el: HTMLElement | null) => {
      if (el) {
        pinElementsRef.current.set(entityId, el)
      } else {
        pinElementsRef.current.delete(entityId)
      }
    }, [])

    // ============================================================
    // ENGINE LIFECYCLE — created once per preset (NOT per world data
    // change). Scene, lighting, camera and GLB models survive
    // entity/polling updates; only avatars are diffed below.
    // ============================================================
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

      // 1. Build environment from preset or custom scene builder
      const activePreset = preset
      if (activePreset && activePreset.buildScene) {
        activePreset.buildScene(engine.scene, {
          nightMode: nightModeRef.current,
          theme: worldRef.current.theme,
          registerTick: engine.registerTick.bind(engine),
        })
      }

      // 2. Avatar container — populated by the entity sync effect below
      const avatarGroup = new THREE.Group()
      avatarGroup.name = 'world-avatars'
      engine.scene.add(avatarGroup)
      avatarGroupRef.current = avatarGroup

      // 3. Collect static interactive objects (workstations, chairs, monitors)
      const staticInteractives: THREE.Object3D[] = []
      engine.scene.traverse((obj) => {
        if (obj.userData && obj.userData.entityId) {
          staticInteractives.push(obj)
        }
      })
      staticInteractivesRef.current = staticInteractives
      engine.interactiveObjects = [...staticInteractives]

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
        avatarRegistryRef.current.clear()
        avatarGroupRef.current = null
        staticInteractivesRef.current = []
        engine.dispose()
        engineRef.current = null
      }
    }, [preset, engineEpoch])

    // ============================================================
    // ENTITY HOT-SYNC — diff world.entities against the avatar
    // registry: add new avatars, update changed ones in place
    // (status halo, animation flags, transform), remove stale ones.
    // No scene rebuild, no GLB reload, no camera reset.
    // ============================================================
    useEffect(() => {
      const engine = engineRef.current
      const avatarGroup = avatarGroupRef.current
      if (!engine || !avatarGroup) return

      // Always point the engine (raycaster/projector/focus) at the latest data
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

      // Remove avatars for entities that no longer exist
      for (const [id, created] of registry) {
        if (!seen.has(id)) {
          created.group.removeFromParent()
          registry.delete(id)
        }
      }

      // Rebuild animator + interactive lists from the registry
      engine.animators = Array.from(registry.values()).map((a) => a.animate)
      engine.interactiveObjects = [
        ...staticInteractivesRef.current,
        ...Array.from(registry.values()).map((a) => a.group),
      ]
    }, [world, preset, engineEpoch])

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
        registerTick: (fn: WorldTickFn) => {
          if (engineRef.current) {
            return engineRef.current.registerTick(fn)
          }
          return () => {}
        },
      }),
      [],
    )

    const handleRestoreContext = useCallback(() => {
      // Rebuild the engine from scratch (fresh WebGL context, fresh scene)
      setContextLost(false)
      setEngineEpoch((epoch) => epoch + 1)
    }, [])

    // Graceful fallback when WebGL is not available at all
    if (webglFailed) {
      return (
        <div
          ref={containerRef}
          className={`wv-container wv-webgl-fallback ${className}`}
          style={style}
          role="region"
          aria-label={`${world.name} 3D environment`}
        >
          <div className="wv-fallback-card">
            <MonitorOff size={28} />
            <h3>3D view unavailable</h3>
            <p>
              Your browser or device does not support WebGL, which is required for the 3D
              environment. Entity data remains available below.
            </p>
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
        aria-label={`${world.name} 3D environment`}
      >
        <canvas ref={canvasRef} className="wv-canvas" />

        {/* WebGL context lost overlay (e.g. GPU driver reset) */}
        {contextLost && (
          <div className="wv-context-lost-overlay">
            <div className="wv-fallback-card">
              <RotateCw size={26} />
              <h3>3D view interrupted</h3>
              <p>The graphics context was lost (usually a GPU or tab reset). Restore it below.</p>
              <button type="button" className="wv-fallback-btn" onClick={handleRestoreContext}>
                Restore 3D view
              </button>
            </div>
          </div>
        )}

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
