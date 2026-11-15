import * as THREE from 'three'
import type { WorldEntity } from '../../core/types'
import type { MaterialPalette } from '../../engine/materials'
import { ModelLoader } from '../../engine/modelLoader'

export interface CreatedAvatar {
  group: THREE.Group
  animate: (delta: number, elapsed: number) => void
  /** Hot-sync entity data (status / position / rotation) without rebuilding the avatar. */
  update: (entity: WorldEntity) => void
}

export function createStylizedAvatar(
  entity: WorldEntity,
  materials: MaterialPalette,
): CreatedAvatar {
  const group = new THREE.Group()
  group.name = `avatar-${entity.id}`
  group.userData = { entityId: entity.id, type: 'person' }

  // Unique phase seed per entity for desynchronized organic movements
  const pinNum = typeof entity.pinNumber === 'number'
    ? entity.pinNumber
    : parseInt(String(entity.pinNumber || '1'), 10) || 1
  const seed = (pinNum * 2.39996) + ((entity.id.charCodeAt(0) || 1) * 0.15)

  // Status Material
  const statusMat = materials.getStatusGlow(entity.status || 'idle')

  // Seated offset relative to workstation center (chair seat is at z = +0.44)
  const isExecutive = entity.id === 'slot-1' || entity.zoneId === 'executive'
  const seatZ = isExecutive ? 0.62 : 0.44

  // Root avatar container positioned at the chair
  const avatarRoot = new THREE.Group()
  avatarRoot.position.set(0, 0, seatZ)
  group.add(avatarRoot)

  // 1. Invisible Click Raycast Proxy (ensures easy clicking)
  const clickProxyGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.6, 8)
  const clickProxyMat = new THREE.MeshBasicMaterial({ visible: false })
  const clickProxy = new THREE.Mesh(clickProxyGeo, clickProxyMat)
  clickProxy.position.set(0, 0.8, -0.1)
  clickProxy.userData = { entityId: entity.id }
  avatarRoot.add(clickProxy)

  // 2. Real 3D Model Container
  const modelsContainer = new THREE.Group()
  modelsContainer.name = `character-real-${entity.id}`
  avatarRoot.add(modelsContainer)

  // Bone node references for procedural animation
  let realHead: THREE.Object3D | null = null
  let realTorso: THREE.Object3D | null = null
  let realLeftArm: THREE.Object3D | null = null
  let realRightArm: THREE.Object3D | null = null

  // 3. Fallback Placeholder Geometry (shown while 3D GLB model loads)
  const placeholderGroup = new THREE.Group()
  placeholderGroup.name = 'character-placeholder'

  const skinMat = materials.getSkinMaterial()
  const hairMat = materials.getHairMaterial(entity.avatarHair || '#1e1b4b')
  const clothesMat = materials.getClothingMaterial(entity.avatarColor || '#2563eb')
  const pantsMat = materials.getDarkSlate('#1e293b')

  const thighs = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.38), pantsMat)
  thighs.position.set(0, 0.48, -0.16)
  thighs.userData = { entityId: entity.id }
  placeholderGroup.add(thighs)

  const torsoPlaceholder = new THREE.Group()
  torsoPlaceholder.position.set(0, 0.6, 0)
  placeholderGroup.add(torsoPlaceholder)

  const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.17, 0.44, 12), clothesMat)
  torsoMesh.position.set(0, 0.22, 0)
  torsoMesh.castShadow = true
  torsoMesh.userData = { entityId: entity.id }
  torsoPlaceholder.add(torsoMesh)

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), skinMat)
  headMesh.position.set(0, 0.66, 0)
  headMesh.castShadow = true
  headMesh.userData = { entityId: entity.id }
  torsoPlaceholder.add(headMesh)

  const hairMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.178, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hairMat,
  )
  hairMesh.position.set(0, 0.69, 0)
  hairMesh.rotation.x = -0.1
  torsoPlaceholder.add(hairMesh)

  avatarRoot.add(placeholderGroup)

  // 4. Select character model variety across 4 distinct models
  const charModels = [
    'character:male-a',
    'character:female-a',
    'character:male-b',
    'character:female-b',
  ]
  const selectedCharId = charModels[pinNum % charModels.length] || 'character:male-a'

  // Load Real 3D Character Model
  const loader = ModelLoader.getInstance()
  void loader.load(selectedCharId).then((charModel) => {
    if (charModel) {
      placeholderGroup.visible = false

      // Scale and position character seated on chair
      charModel.scale.set(1.65, 1.65, 1.65)
      charModel.position.set(0, 0.44, -0.05)
      charModel.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.castShadow = true
          node.receiveShadow = true
        }
        node.userData = { entityId: entity.id }
      })

      // Locate anatomical bone nodes
      realHead = charModel.getObjectByName('head') || null
      realTorso = charModel.getObjectByName('torso') || null
      realLeftArm = charModel.getObjectByName('arm-left') || null
      realRightArm = charModel.getObjectByName('arm-right') || null

      const legLeft = charModel.getObjectByName('leg-left')
      const legRight = charModel.getObjectByName('leg-right')

      // Bend legs forward at 90 degrees into natural seated posture
      if (legLeft) legLeft.rotation.x = -Math.PI / 2.2
      if (legRight) legRight.rotation.x = -Math.PI / 2.2

      // Position arms forward resting on desk
      if (realLeftArm) {
        realLeftArm.rotation.x = Math.PI / 2.6
        realLeftArm.rotation.z = -0.15
      }
      if (realRightArm) {
        realRightArm.rotation.x = Math.PI / 2.6
        realRightArm.rotation.z = 0.15
      }

      modelsContainer.add(charModel)
    }
  })

  // 5. Floating Status Pin Indicator (Compact, elegant glow disk)
  const statusHalo = new THREE.Mesh(
    new THREE.RingGeometry(0.07, 0.11, 24),
    statusMat,
  )
  statusHalo.position.set(0, 1.7, 0)
  statusHalo.rotation.x = -Math.PI / 2
  statusHalo.userData = { entityId: entity.id }
  avatarRoot.add(statusHalo)

  // 6. Realistic Procedural Animation Function
  const baseTorsoY = 0.6
  // Mutable status flags so hot-synced updates can change animation behaviour live
  let isWorking = entity.status === 'running' || entity.status === 'working'
  let isAwaiting = entity.status === 'awaiting_approval'
  let currentStatus = entity.status || 'idle'
  const breathFreq = 1.3 + (seed % 0.4)
  const glanceFreq = 0.22 + ((seed * 3) % 0.15)

  const animate = (_delta: number, elapsed: number) => {
    // Breathing cycle
    const breath = Math.sin(elapsed * breathFreq + seed) * 0.007
    torsoPlaceholder.position.y = baseTorsoY + breath

    if (realTorso) {
      realTorso.position.y = breath * 0.5
      realTorso.rotation.x = Math.sin(elapsed * breathFreq + seed) * 0.012
    }

    // Natural Gaze between dual monitors
    const glanceCycle = Math.sin(elapsed * glanceFreq + seed)

    if (isWorking) {
      // Active working glances & typing
      if (realHead) {
        realHead.rotation.y = glanceCycle * 0.28
        realHead.rotation.x = -0.04
      }

      if (realLeftArm) {
        realLeftArm.rotation.x = Math.PI / 2.6 + Math.sin(elapsed * 12 + seed) * 0.03
      }
      if (realRightArm) {
        const mouseCycle = Math.sin(elapsed * 0.9 + seed)
        if (mouseCycle > 0.3) {
          // Slide arm to mouse
          realRightArm.rotation.x = Math.PI / 2.8
          realRightArm.rotation.y = 0.18
        } else {
          // Typing on keyboard
          realRightArm.rotation.x = Math.PI / 2.6 + Math.cos(elapsed * 14 + seed) * 0.03
          realRightArm.rotation.y = 0
        }
      }

      statusHalo.scale.setScalar(1 + Math.sin(elapsed * 3.5 + seed) * 0.15)
    } else if (isAwaiting) {
      if (realHead) {
        realHead.rotation.y = Math.sin(elapsed * 0.4 + seed) * 0.15
        realHead.rotation.z = 0.12 // thoughtful tilt
      }
      statusHalo.scale.setScalar(1 + Math.sin(elapsed * 2) * 0.2)
    } else {
      // Idle
      if (realHead) {
        realHead.rotation.y = glanceCycle * 0.18
        realHead.rotation.z = 0
      }
      if (realLeftArm) realLeftArm.rotation.x = Math.PI / 2.6
      if (realRightArm) {
        realRightArm.rotation.x = Math.PI / 2.6
        realRightArm.rotation.y = 0
      }
      statusHalo.scale.setScalar(1)
    }
  }

  // Set world position and orientation
  group.position.set(entity.position[0], entity.position[1], entity.position[2])
  if (entity.rotation) {
    group.rotation.set(entity.rotation[0], entity.rotation[1], entity.rotation[2])
  }

  // 7. Hot-sync: apply live entity data changes without rebuilding the avatar
  const update = (next: WorldEntity) => {
    const nextStatus = next.status || 'idle'
    if (nextStatus !== currentStatus) {
      currentStatus = nextStatus
      isWorking = nextStatus === 'running' || nextStatus === 'working'
      isAwaiting = nextStatus === 'awaiting_approval'
      statusHalo.material = materials.getStatusGlow(nextStatus)
    }

    group.position.set(next.position[0], next.position[1], next.position[2])
    if (next.rotation) {
      group.rotation.set(next.rotation[0], next.rotation[1], next.rotation[2])
    }
  }

  return { group, animate, update }
}
