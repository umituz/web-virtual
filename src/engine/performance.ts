import * as THREE from 'three'
import type { WorldEntity } from '../core/types'

export class PerformanceManager {
  private lastTime = performance.now()
  private frameCount = 0
  private fps = 60
  private adaptiveRatio = 1.0

  update(): number {
    this.frameCount++
    const now = performance.now()
    const delta = now - this.lastTime

    if (delta >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / delta)
      this.frameCount = 0
      this.lastTime = now

      // Adaptive quality adjustment
      if (this.fps < 30 && this.adaptiveRatio > 0.75) {
        this.adaptiveRatio = Math.max(0.75, this.adaptiveRatio - 0.1)
      } else if (this.fps > 55 && this.adaptiveRatio < 1.0) {
        this.adaptiveRatio = Math.min(1.0, this.adaptiveRatio + 0.05)
      }
    }

    return this.fps
  }

  getFps(): number {
    return this.fps
  }

  getAdaptiveRatio(): number {
    return this.adaptiveRatio
  }
}

export class DirectDOMProjector {
  private tempVec = new THREE.Vector3()

  projectEntities(
    entities: WorldEntity[],
    camera: THREE.Camera,
    width: number,
    height: number,
    elementMap: Map<string, HTMLElement>,
  ): void {
    const halfW = width / 2
    const halfH = height / 2

    for (const entity of entities) {
      const el = elementMap.get(entity.id)
      if (!el) continue

      // Head / top of desk elevation offset (+ 1.5 units)
      this.tempVec.set(
        entity.position[0],
        entity.position[1] + 1.45,
        entity.position[2],
      )

      this.tempVec.project(camera)

      // Check if behind camera
      if (this.tempVec.z > 1.0) {
        el.style.display = 'none'
        continue
      }

      el.style.display = ''
      const screenX = this.tempVec.x * halfW + halfW
      const screenY = -(this.tempVec.y * halfH) + halfH

      el.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`
    }
  }
}
