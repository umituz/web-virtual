import * as THREE from 'three'

export interface RaycastHit {
  entityId: string
  point: THREE.Vector3
  distance: number
}

export class WorldRaycaster {
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()

  constructor() {
    this.raycaster.params.Points = { threshold: 0.2 }
  }

  intersect(
    clientX: number,
    clientY: number,
    rect: DOMRect,
    camera: THREE.Camera,
    interactiveObjects: THREE.Object3D[],
  ): RaycastHit | null {
    if (rect.width === 0 || rect.height === 0) return null

    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, camera)
    const intersects = this.raycaster.intersectObjects(interactiveObjects, true)

    if (intersects.length === 0) return null

    for (const hit of intersects) {
      let curr: THREE.Object3D | null = hit.object
      while (curr) {
        if (curr.userData && curr.userData.entityId) {
          return {
            entityId: curr.userData.entityId,
            point: hit.point,
            distance: hit.distance,
          }
        }
        curr = curr.parent
      }
    }

    return null
  }
}
