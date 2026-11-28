import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import type {
  WorldDefinition,
  WorldEntity,
  EntitySelectedEvent,
  WorldTickFn,
  UnregisterTick,
  WorldTourConfig,
} from '../core/types'
import { MaterialPalette } from './materials'
import { WorldLighting } from './lighting'
import { WorldCamera, type CameraPresetName } from './camera'
import { WorldRaycaster } from './raycaster'
import { PerformanceManager, DirectDOMProjector } from './performance'
import { createCameraTour, type CameraTourHandle } from './tour'
import { damp } from './animation'

export interface WorldEngineOptions {
  canvas: HTMLCanvasElement
  world: WorldDefinition
  pinElements?: Map<string, HTMLElement>
  onSelectEntity?: (event: EntitySelectedEvent) => void
  onHoverEntity?: (entity: WorldEntity | null) => void
  onFpsUpdate?: (fps: number) => void
  onContextLost?: () => void
}

interface TourRunState {
  config: WorldTourConfig
  handle: CameraTourHandle
  index: number
  phase: 'move' | 'hold'
  phaseElapsed: number
  onStop?: (index: number) => void
  unregister: UnregisterTick
}

export class WorldEngine {
  public scene: THREE.Scene
  public renderer: THREE.WebGLRenderer
  public materials: MaterialPalette
  public lighting: WorldLighting
  public cameraSystem: WorldCamera
  public raycaster: WorldRaycaster
  public perfManager: PerformanceManager
  public projector: DirectDOMProjector

  public interactiveObjects: THREE.Object3D[] = []
  public animators: Array<(delta: number, elapsed: number) => void> = []

  /** Consumer-registered per-frame callbacks (wind, water, machinery…). */
  private ticks = new Set<WorldTickFn>()

  private isDisposed = false
  private animationFrameId: number | null = null
  private visibilityHandler: (() => void) | null = null
  private clock = new THREE.Clock()
  private hoveredEntityId: string | null = null
  private composer: EffectComposer | null = null
  private tourState: TourRunState | null = null

  constructor(private options: WorldEngineOptions) {
    const { canvas, world } = options

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(world.theme.backgroundColor || '#f8fafc')

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    })

    const width = canvas.parentElement?.clientWidth || window.innerWidth
    const height = canvas.parentElement?.clientHeight || window.innerHeight

    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = world.lighting.shadows !== false
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05

    this.materials = new MaterialPalette()
    this.lighting = new WorldLighting(this.scene, world.lighting)
    this.cameraSystem = new WorldCamera(canvas, width / height, world.camera)
    this.raycaster = new WorldRaycaster()
    this.perfManager = new PerformanceManager()
    this.projector = new DirectDOMProjector()

    const bloom = world.effects?.bloom
    if (bloom) {
      const cfg = bloom === true ? {} : bloom
      const composer = new EffectComposer(this.renderer)
      composer.addPass(new RenderPass(this.scene, this.cameraSystem.camera))
      const size = this.renderer.getSize(new THREE.Vector2())
      composer.addPass(
        new UnrealBloomPass(
          size,
          cfg.strength ?? 0.55,
          cfg.radius ?? 0.6,
          cfg.threshold ?? 0.72,
        ),
      )
      composer.addPass(new OutputPass())
      this.composer = composer
    }

    this.initEventListeners(canvas)
    this.initContextLossHandling(canvas)
    this.startLoop()
  }

  /**
   * Hot-sync the world data (entities, theme, zones) without rebuilding the scene.
   * Raycast lookups, label projection and camera focus immediately use the new data.
   */
  public updateWorld(world: WorldDefinition): void {
    this.options.world = world
  }

  /**
   * Register a per-frame animation callback stepped inside the engine's own
   * render loop. Callbacks pause with the document (battery-aware) and are
   * cleared when the engine is disposed. Returns an unregister function.
   */
  public registerTick(fn: WorldTickFn): UnregisterTick {
    this.ticks.add(fn)
    return () => {
      this.ticks.delete(fn)
    }
  }

  /**
   * Guided cinematic tour: slowly orbits (auto-rotate) while cycling through
   * camera stops. Stops carrying `position` + `target` are damped to during a
   * transition window; `onStop` fires on each arrival so the host UI can show
   * the stop's narration.
   */
  public startTour(config: WorldTourConfig, onStop?: (index: number) => void): void {
    this.stopTour()
    if (config.stops.length === 0) return
    const handle = createCameraTour({
      controls: this.cameraSystem.controls,
      speed: config.autoRotateSpeed,
    })
    const first = config.stops[0]
    if (first?.position && first.target) handle.stop()
    const state: TourRunState = {
      config,
      handle,
      index: 0,
      phase: 'move',
      phaseElapsed: 0,
      onStop,
      unregister: () => {},
    }
    state.unregister = this.registerTick((delta) => {
      this.stepTour(state, delta)
    })
    this.tourState = state
    handle.start()
    this.stepTour(state, 0)
  }

  public stopTour(): void {
    const state = this.tourState
    if (!state) return
    state.unregister()
    state.handle.stop()
    this.tourState = null
  }

  public isTouring(): boolean {
    return this.tourState !== null
  }

  private stepTour(state: TourRunState, delta: number): void {
    const stops = state.config.stops
    const stop = stops[state.index]
    if (!stop) {
      this.stopTour()
      return
    }
    const transitionSeconds = state.config.transitionSeconds ?? 2.4
    const holdSeconds = stop.holdSeconds ?? 6
    state.phaseElapsed += delta

    if (state.phase === 'move') {
      const hasFocus = stop.position != null && stop.target != null
      if (stop.position && stop.target) {
        const lambda = 3.2
        const camera = this.cameraSystem.camera
        const target = this.cameraSystem.controls.target
        camera.position.set(
          damp(camera.position.x, stop.position[0], lambda, delta),
          damp(camera.position.y, stop.position[1], lambda, delta),
          damp(camera.position.z, stop.position[2], lambda, delta),
        )
        target.set(
          damp(target.x, stop.target[0], lambda, delta),
          damp(target.y, stop.target[1], lambda, delta),
          damp(target.z, stop.target[2], lambda, delta),
        )
      }
      if (state.phaseElapsed >= (hasFocus ? transitionSeconds : 0)) {
        state.phase = 'hold'
        state.phaseElapsed = 0
        state.handle.start()
        state.onStop?.(state.index)
      }
      return
    }

    if (state.phaseElapsed >= holdSeconds) {
      state.index = (state.index + 1) % stops.length
      state.phase = 'move'
      state.phaseElapsed = 0
      const next = stops[state.index]
      if (next?.position && next.target) state.handle.stop()
    }
  }

  /** Pause rendering while the tab is hidden to save battery/CPU. */
  private initContextLossHandling(canvas: HTMLCanvasElement): void {
    canvas.addEventListener(
      'webglcontextlost',
      (e) => {
        e.preventDefault()
        this.stopLoop()
        if (this.options.onContextLost) this.options.onContextLost()
      },
      false,
    )
  }

  /** Resume the render loop after a pause (tab visible again or context restored). */
  public resumeLoop(): void {
    if (this.isDisposed) return
    if (this.animationFrameId === null) {
      // Flush the accumulated delta so animations do not jump after the pause
      this.clock.getDelta()
      this.startLoop()
    }
  }

  private initEventListeners(canvas: HTMLCanvasElement): void {
    let pointerDownX = 0
    let pointerDownY = 0

    const handlePointerDown = (e: MouseEvent) => {
      pointerDownX = e.clientX
      pointerDownY = e.clientY
    }

    const handleClick = (e: MouseEvent) => {
      if (e.button !== 0) return // Left click only
      // If mouse moved more than 6px between mousedown and mouseup/click, it was a camera drag
      const dragDist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY)
      if (dragDist > 6) return

      const rect = canvas.getBoundingClientRect()
      const hit = this.raycaster.intersect(
        e.clientX,
        e.clientY,
        rect,
        this.cameraSystem.camera,
        this.interactiveObjects,
      )

      if (hit) {
        const entity = this.options.world.entities.find((en) => en.id === hit.entityId)
        if (entity && this.options.onSelectEntity) {
          this.options.onSelectEntity({
            entity,
            position: entity.position,
            screenPosition: { x: e.clientX, y: e.clientY },
          })
        }
      }
    }

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const hit = this.raycaster.intersect(
        e.clientX,
        e.clientY,
        rect,
        this.cameraSystem.camera,
        this.interactiveObjects,
      )

      const hitId = hit ? hit.entityId : null
      if (hitId !== this.hoveredEntityId) {
        this.hoveredEntityId = hitId
        canvas.style.cursor = hitId ? 'pointer' : 'default'

        if (this.options.onHoverEntity) {
          const entity = hitId
            ? this.options.world.entities.find((en) => en.id === hitId) || null
            : null
          this.options.onHoverEntity(entity)
        }
      }
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('click', handleClick)
    canvas.addEventListener('mousemove', handlePointerMove)

    // Store unbind callbacks on instance
    this.unbindEvents = () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('click', handleClick)
      canvas.removeEventListener('mousemove', handlePointerMove)
    }
  }

  private unbindEvents: () => void = () => {}

  public resize(width: number, height: number): void {
    if (this.isDisposed || width <= 0 || height <= 0) return
    this.cameraSystem.updateAspect(width / height)
    this.renderer.setSize(width, height)
    this.composer?.setSize(width, height)
  }

  public setNightMode(isNight: boolean): void {
    this.lighting.setNightMode(isNight)
    const bgColor = isNight
      ? this.options.world.theme.nightBackgroundColor || '#0f172a'
      : this.options.world.theme.backgroundColor || '#f8fafc'
    this.scene.background = new THREE.Color(bgColor)
  }

  public setCameraPreset(preset: CameraPresetName): void {
    this.cameraSystem.setPreset(preset)
  }

  public focusOnEntity(entityId: string): void {
    const entity = this.options.world.entities.find((en) => en.id === entityId)
    if (entity) {
      this.cameraSystem.focusOn(entity.position, 7)
    }
  }

  public resetCamera(): void {
    this.cameraSystem.reset()
  }

  private startLoop(): void {
    // Pause the render loop while the document is hidden (saves battery/CPU)
    if (this.visibilityHandler === null) {
      this.visibilityHandler = () => {
        if (this.isDisposed) return
        if (document.hidden) {
          this.stopLoop()
        } else {
          this.resumeLoop()
        }
      }
      document.addEventListener('visibilitychange', this.visibilityHandler)
    }

    const loop = () => {
      if (this.isDisposed) return

      const delta = this.clock.getDelta()
      const elapsed = this.clock.getElapsedTime()

      // Update camera smooth transitions & controls damping
      this.cameraSystem.update()

      // Update animations (avatar subtle breathing, active working pulses)
      for (const animator of this.animators) {
        animator(delta, elapsed)
      }

      // Step consumer-registered scene animations (wind, water, machinery…)
      if (this.ticks.size > 0) {
        for (const tick of this.ticks) {
          tick(delta, elapsed)
        }
      }

      // Render Three.js scene
      if (this.composer) {
        this.composer.render(delta)
      } else {
        this.renderer.render(this.scene, this.cameraSystem.camera)
      }

      // Direct GPU CSS translate3d projection for 60fps labels without React re-render
      if (this.options.pinElements && this.options.pinElements.size > 0) {
        const rect = this.renderer.domElement.getBoundingClientRect()
        this.projector.projectEntities(
          this.options.world.entities,
          this.cameraSystem.camera,
          rect.width,
          rect.height,
          this.options.pinElements,
        )
      }

      // Performance monitoring
      const fps = this.perfManager.update()
      if (this.options.onFpsUpdate && Math.random() < 0.05) {
        this.options.onFpsUpdate(fps)
      }

      this.animationFrameId = requestAnimationFrame(loop)
    }

    this.animationFrameId = requestAnimationFrame(loop)
  }

  private stopLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  public dispose(): void {
    this.isDisposed = true
    this.stopTour()
    this.stopLoop()
    this.ticks.clear()
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler)
      this.visibilityHandler = null
    }

    this.unbindEvents()
    this.cameraSystem.dispose()
    this.lighting.dispose()
    this.materials.dispose()

    // Clear meshes and scene
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose())
        } else if (obj.material) {
          obj.material.dispose()
        }
      }
    })
    this.scene.clear()

    this.composer?.dispose()
    this.renderer.dispose()
  }
}
