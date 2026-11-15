import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { CameraConfiguration, Vector3Tuple } from '../core/types'

export type CameraPresetName = 'isometric' | 'top' | 'front' | 'side'

export class WorldCamera {
  public camera: THREE.PerspectiveCamera
  public controls: OrbitControls

  private targetPosition = new THREE.Vector3()
  private targetLookAt = new THREE.Vector3()
  private isTransitioning = false
  private transitionSpeed = 0.08

  constructor(
    canvas: HTMLCanvasElement,
    aspect: number,
    private config: CameraConfiguration,
  ) {
    this.camera = new THREE.PerspectiveCamera(
      config.fov || 40,
      aspect,
      config.near || 0.1,
      config.far || 250,
    )

    const pos = config.position || [26, 24, 26]
    this.camera.position.set(pos[0], pos[1], pos[2])

    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enableDamping = config.enableDamping ?? true
    this.controls.dampingFactor = config.dampingFactor ?? 0.08
    this.controls.rotateSpeed = 0.95
    this.controls.zoomSpeed = 1.25
    this.controls.panSpeed = 1.0
    this.controls.screenSpacePanning = true
    this.controls.maxPolarAngle = config.maxPolarAngle ?? Math.PI / 2 - 0.05
    this.controls.minDistance = config.minDistance ?? 8
    this.controls.maxDistance = config.maxDistance ?? 65

    const tgt = config.target || [0, 0, 0]
    this.controls.target.set(tgt[0], tgt[1], tgt[2])
    this.controls.update()
  }

  updateAspect(aspect: number): void {
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
  }

  update(): void {
    if (this.isTransitioning) {
      this.camera.position.lerp(this.targetPosition, this.transitionSpeed)
      this.controls.target.lerp(this.targetLookAt, this.transitionSpeed)

      if (
        this.camera.position.distanceTo(this.targetPosition) < 0.1 &&
        this.controls.target.distanceTo(this.targetLookAt) < 0.1
      ) {
        this.camera.position.copy(this.targetPosition)
        this.controls.target.copy(this.targetLookAt)
        this.isTransitioning = false
      }
    }

    this.controls.update()
  }

  focusOn(position: Vector3Tuple, distance = 8): void {
    const tgt = new THREE.Vector3(position[0], position[1], position[2])
    const offset = new THREE.Vector3(distance * 0.7, distance * 0.7, distance * 0.7)

    this.targetLookAt.copy(tgt)
    this.targetPosition.copy(tgt).add(offset)
    this.isTransitioning = true
  }

  setPreset(preset: CameraPresetName): void {
    const tgt = new THREE.Vector3(0, 0, 0)
    let pos = new THREE.Vector3(26, 24, 26)

    switch (preset) {
      case 'isometric':
        pos = new THREE.Vector3(26, 24, 26)
        break
      case 'top':
        pos = new THREE.Vector3(0, 36, 0.01)
        break
      case 'front':
        pos = new THREE.Vector3(0, 15, 30)
        break
      case 'side':
        pos = new THREE.Vector3(32, 16, 0)
        break
    }

    this.targetLookAt.copy(tgt)
    this.targetPosition.copy(pos)
    this.isTransitioning = true
  }

  reset(): void {
    const defaultPos = this.config.position || [26, 24, 26]
    const defaultTgt = this.config.target || [0, 0, 0]

    this.targetPosition.set(defaultPos[0], defaultPos[1], defaultPos[2])
    this.targetLookAt.set(defaultTgt[0], defaultTgt[1], defaultTgt[2])
    this.isTransitioning = true
  }

  dispose(): void {
    this.controls.dispose()
  }
}
