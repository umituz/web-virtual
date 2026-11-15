import * as THREE from 'three'
import type { WorldEntity } from '../../core/types'
import type { MaterialPalette } from '../../engine/materials'

export interface CreatedAvatar {
  group: THREE.Group
  animate: (delta: number, elapsed: number) => void
}

export function createStylizedAvatar(
  entity: WorldEntity,
  materials: MaterialPalette,
): CreatedAvatar {
  const group = new THREE.Group()
  group.name = `avatar-${entity.id}`
  group.userData = { entityId: entity.id, type: 'person' }

  // Material selection based on entity configuration
  const skinMat = materials.getSkinMaterial()
  const hairMat = materials.getHairMaterial(entity.avatarHair || '#1e1b4b')
  const clothesMat = materials.getClothingMaterial(entity.avatarColor || '#2563eb')
  const statusMat = materials.getStatusGlow(entity.status || 'idle')

  // 1. Torso / Shirt
  const torsoGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.55, 12)
  const torso = new THREE.Mesh(torsoGeo, clothesMat)
  torso.position.set(0, 0.75, 0)
  torso.castShadow = true
  torso.userData = { entityId: entity.id }
  group.add(torso)

  // 2. Neck
  const neckGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 8)
  const neck = new THREE.Mesh(neckGeo, skinMat)
  neck.position.set(0, 1.05, 0)
  neck.userData = { entityId: entity.id }
  group.add(neck)

  // 3. Head
  const headGeo = new THREE.SphereGeometry(0.2, 16, 16)
  const head = new THREE.Mesh(headGeo, skinMat)
  head.position.set(0, 1.25, 0)
  head.castShadow = true
  head.userData = { entityId: entity.id }
  group.add(head)

  // 4. Stylized Hair
  const hairGeo = new THREE.SphereGeometry(0.21, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2)
  const hair = new THREE.Mesh(hairGeo, hairMat)
  hair.position.set(0, 1.28, 0)
  hair.rotation.x = -0.15
  hair.userData = { entityId: entity.id }
  group.add(hair)

  // 5. Arms (positioned over desk typing)
  const leftArmGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.38, 8)
  const leftArm = new THREE.Mesh(leftArmGeo, clothesMat)
  leftArm.position.set(-0.28, 0.72, 0.15)
  leftArm.rotation.x = Math.PI / 3.5
  leftArm.rotation.z = 0.2
  leftArm.userData = { entityId: entity.id }
  group.add(leftArm)

  const rightArmGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.38, 8)
  const rightArm = new THREE.Mesh(rightArmGeo, clothesMat)
  rightArm.position.set(0.28, 0.72, 0.15)
  rightArm.rotation.x = Math.PI / 3.5
  rightArm.rotation.z = -0.2
  rightArm.userData = { entityId: entity.id }
  group.add(rightArm)

  // 6. Sitting Legs
  const legsGeo = new THREE.BoxGeometry(0.36, 0.15, 0.42)
  const legs = new THREE.Mesh(legsGeo, clothesMat)
  legs.position.set(0, 0.45, 0.1)
  legs.userData = { entityId: entity.id }
  group.add(legs)

  // 7. Status Halo Ring (hovering above head)
  const haloGeo = new THREE.RingGeometry(0.12, 0.16, 24)
  const halo = new THREE.Mesh(haloGeo, statusMat)
  halo.position.set(0, 1.55, 0)
  halo.rotation.x = -Math.PI / 2
  halo.userData = { entityId: entity.id }
  group.add(halo)

  // Dynamic animation callback
  const initialTorsoY = torso.position.y
  const isWorking = entity.status === 'running' || entity.status === 'working'

  const animate = (_delta: number, elapsed: number) => {
    // Subtle breathing animation
    const breath = Math.sin(elapsed * 2.5 + Number(entity.pinNumber || 0)) * 0.015
    torso.position.y = initialTorsoY + breath
    head.position.y = 1.25 + breath

    if (isWorking) {
      // Typing agitation
      const typing1 = Math.sin(elapsed * 12 + Number(entity.pinNumber || 0)) * 0.06
      const typing2 = Math.cos(elapsed * 14 + Number(entity.pinNumber || 0)) * 0.06
      leftArm.rotation.x = Math.PI / 3.5 + typing1
      rightArm.rotation.x = Math.PI / 3.5 + typing2

      // Pulsing halo
      halo.scale.setScalar(1 + Math.sin(elapsed * 4) * 0.2)
    }
  }

  // Position the group
  group.position.set(entity.position[0], entity.position[1], entity.position[2])
  if (entity.rotation) {
    group.rotation.set(entity.rotation[0], entity.rotation[1], entity.rotation[2])
  }

  return { group, animate }
}
