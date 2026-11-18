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

  // Status state
  let currentStatus = entity.status || 'idle'
  const statusMat = materials.getStatusGlow(currentStatus)

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

  // 3. Floating Status Pin Indicator (Compact, elegant glow disk)
  const statusHalo = new THREE.Mesh(
    new THREE.RingGeometry(0.07, 0.11, 24),
    statusMat,
  )
  statusHalo.position.set(0, 1.7, 0)
  statusHalo.rotation.x = -Math.PI / 2
  statusHalo.userData = { entityId: entity.id }
  avatarRoot.add(statusHalo)

  // 4. Select character model variety across 4 distinct models
  const charModels = [
    'character:male-a',
    'character:female-a',
    'character:male-b',
    'character:female-b',
  ]
  const selectedCharId = charModels[pinNum % charModels.length] || 'character:male-a'

  // Three.js AnimationMixer state
  let mixer: THREE.AnimationMixer | null = null
  let sitAction: THREE.AnimationAction | null = null
  let interactAction: THREE.AnimationAction | null = null
  let emoteAction: THREE.AnimationAction | null = null
  let isWorking = currentStatus === 'running' || currentStatus === 'working'
  let isAwaiting = currentStatus === 'awaiting_approval'

  function syncAnimationActions() {
    if (!mixer) return
    if (isWorking) {
      if (emoteAction) emoteAction.fadeOut(0.2)
      if (interactAction) {
        interactAction.reset().fadeIn(0.2).play()
      }
    } else if (isAwaiting) {
      if (interactAction) interactAction.fadeOut(0.2)
      if (emoteAction) {
        emoteAction.reset().fadeIn(0.2).play()
      }
    } else {
      if (interactAction) interactAction.fadeOut(0.2)
      if (emoteAction) emoteAction.fadeOut(0.2)
      if (sitAction && !sitAction.isRunning()) {
        sitAction.reset().fadeIn(0.2).play()
      }
    }
  }

  // Load Real 3D Character Model and bind standard Three.js AnimationMixer
  const loader = ModelLoader.getInstance()
  void loader.load(selectedCharId).then((charModel) => {
    if (!charModel) return

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

    // Setup native Three.js AnimationMixer with GLB animations
    const animations = charModel.animations || []
    if (animations.length > 0) {
      mixer = new THREE.AnimationMixer(charModel)

      const sitClip = THREE.AnimationClip.findByName(animations, 'sit')
      if (sitClip) {
        sitAction = mixer.clipAction(sitClip)
        sitAction.setLoop(THREE.LoopRepeat, Infinity)
        sitAction.play()
      }

      const interactClip = THREE.AnimationClip.findByName(animations, 'interact-right')
      if (interactClip) {
        interactAction = mixer.clipAction(interactClip)
        interactAction.setLoop(THREE.LoopRepeat, Infinity)
      }

      const emoteClip = THREE.AnimationClip.findByName(animations, 'emote-yes')
      if (emoteClip) {
        emoteAction = mixer.clipAction(emoteClip)
        emoteAction.setLoop(THREE.LoopRepeat, Infinity)
      }

      syncAnimationActions()
    }

    modelsContainer.add(charModel)
  })

  // 6. Standard Three.js Render Step
  const animate = (delta: number, elapsed: number) => {
    // A. Advance Three.js AnimationMixer
    if (mixer) {
      mixer.update(delta)
    }

    // B. Status Halo organic pulsing based on status
    if (isWorking) {
      statusHalo.scale.setScalar(1 + Math.sin(elapsed * 3.5 + seed) * 0.15)
    } else if (isAwaiting) {
      statusHalo.scale.setScalar(1 + Math.sin(elapsed * 2 + seed) * 0.2)
    } else {
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
      syncAnimationActions()
    }

    group.position.set(next.position[0], next.position[1], next.position[2])
    if (next.rotation) {
      group.rotation.set(next.rotation[0], next.rotation[1], next.rotation[2])
    }
  }

  return { group, animate, update }
}
