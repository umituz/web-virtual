import * as THREE from 'three'
import type { WorldDefinition, WorldEntity, EntitySelectedEvent } from '../core/types'
import { MaterialPalette } from './materials'
import { WorldLighting } from './lighting'
import { WorldCamera, type CameraPresetName } from './camera'
import { WorldRaycaster } from './raycaster'
import { PerformanceManager, DirectDOMProjector } from './performance'

export interface WorldEngineOptions {
  canvas: HTMLCanvasElement
  world: WorldDefinition
  pinElements?: Map<string, HTMLElement>
  onSelectEntity?: (event: EntitySelectedEvent) => void
  onHoverEntity?: (entity: WorldEntity | null) => void
  onFpsUpdate?: (fps: number) => void
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

  private isDisposed = false
  private animationFrameId: number | null = null
  private clock = new THREE.Clock()
  private hoveredEntityId: string | null = null

  constructor(private options: WorldEngineOptions) {
    const { canvas, world } = options

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(world.theme.backgroundColor || '#0f172a')

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

    this.initEventListeners(canvas)
    this.startLoop()
  }

  private initEventListeners(canvas: HTMLCanvasElement): void {
    const handlePointerDown = (e: MouseEvent) => {
      if (e.button !== 0) return // Left click only
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

    canvas.addEventListener('click', handlePointerDown)
    canvas.addEventListener('mousemove', handlePointerMove)

    // Store unbind callbacks on instance
    this.unbindEvents = () => {
      canvas.removeEventListener('click', handlePointerDown)
      canvas.removeEventListener('mousemove', handlePointerMove)
    }
  }

  private unbindEvents: () => void = () => {}

  public resize(width: number, height: number): void {
    if (this.isDisposed || width <= 0 || height <= 0) return
    this.cameraSystem.updateAspect(width / height)
    this.renderer.setSize(width, height)
  }

  public setNightMode(isNight: boolean): void {
    this.lighting.setNightMode(isNight)
    const bgColor = isNight
      ? this.options.world.theme.nightBackgroundColor || '#020617'
      : this.options.world.theme.backgroundColor || '#0f172a'
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

      // Render Three.js scene
      this.renderer.render(this.scene, this.cameraSystem.camera)

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

  public dispose(): void {
    this.isDisposed = true
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
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

    this.renderer.dispose()
  }
}
