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

      // Elevation offset above avatar head (chair seated at z offset)
      const isExec = entity.id === 'slot-1' || entity.zoneId === 'executive'
      const seatZ = isExec ? 0.62 : 0.44

      this.tempVec.set(
        entity.position[0],
        entity.position[1] + 1.6,
        entity.position[2] + seatZ,
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
      el.style.zIndex = String(Math.max(1, Math.round((1 - this.tempVec.z) * 1000)))
    }
  }
}
