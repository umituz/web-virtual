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

  // Unique phase seed per entity for desynchronized organic movements
  const pinNum = typeof entity.pinNumber === 'number'
    ? entity.pinNumber
    : parseInt(String(entity.pinNumber || '1'), 10) || 1
  const seed = (pinNum * 2.39996) + ((entity.id.charCodeAt(0) || 1) * 0.15)

  // Material selection
  const skinMat = materials.getSkinMaterial()
  const hairMat = materials.getHairMaterial(entity.avatarHair || '#1e1b4b')
  const clothesMat = materials.getClothingMaterial(entity.avatarColor || '#2563eb')
  const pantsMat = materials.getDarkSlate('#1e293b')
  const statusMat = materials.getStatusGlow(entity.status || 'idle')

  // Seated offset relative to workstation center (chair seat is at z = +0.45)
  // For executive desk (slot-1), chair is at z = +0.65
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

  // 2. Seated Thighs & Lower Legs in Dark Slacks
  const thighsGeo = new THREE.BoxGeometry(0.36, 0.12, 0.38)
  const thighs = new THREE.Mesh(thighsGeo, pantsMat)
  thighs.position.set(0, 0.48, -0.16)
  thighs.userData = { entityId: entity.id }
  avatarRoot.add(thighs)

  const leftShin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.12), pantsMat)
  leftShin.position.set(-0.11, 0.22, -0.32)
  leftShin.userData = { entityId: entity.id }
  avatarRoot.add(leftShin)

  const rightShin = leftShin.clone()
  rightShin.position.x = 0.11
  avatarRoot.add(rightShin)

  // 3. Pelvis / Hips
  const hipsGeo = new THREE.BoxGeometry(0.38, 0.14, 0.26)
  const hips = new THREE.Mesh(hipsGeo, pantsMat)
  hips.position.set(0, 0.52, 0)
  hips.userData = { entityId: entity.id }
  avatarRoot.add(hips)

  // 4. Upper Torso / Tailored Polo or Shirt
  const torsoGroup = new THREE.Group()
  torsoGroup.position.set(0, 0.6, 0)
  avatarRoot.add(torsoGroup)

  const torsoGeo = new THREE.CylinderGeometry(0.20, 0.17, 0.44, 12)
  const torso = new THREE.Mesh(torsoGeo, clothesMat)
  torso.position.set(0, 0.22, 0)
  torso.castShadow = true
  torso.userData = { entityId: entity.id }
  torsoGroup.add(torso)

  // Collar / neckline detail
  const collarGeo = new THREE.CylinderGeometry(0.13, 0.14, 0.06, 10)
  const collar = new THREE.Mesh(collarGeo, clothesMat)
  collar.position.set(0, 0.44, 0)
  collar.userData = { entityId: entity.id }
  torsoGroup.add(collar)

  // 5. Neck & Sculpted Head
  const neckGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.1, 10)
  const neck = new THREE.Mesh(neckGeo, skinMat)
  neck.position.set(0, 0.5, 0)
  neck.userData = { entityId: entity.id }
  torsoGroup.add(neck)

  const headGroup = new THREE.Group()
  headGroup.position.set(0, 0.66, 0)
  torsoGroup.add(headGroup)

  const headGeo = new THREE.SphereGeometry(0.17, 18, 18)
  const head = new THREE.Mesh(headGeo, skinMat)
  head.castShadow = true
  head.userData = { entityId: entity.id }
  headGroup.add(head)

  // Nose & stylized face profile hint
  const noseGeo = new THREE.ConeGeometry(0.03, 0.06, 6)
  const nose = new THREE.Mesh(noseGeo, skinMat)
  nose.position.set(0, 0, -0.175)
  nose.rotation.x = -Math.PI / 2
  headGroup.add(nose)

  // 6. Stylized Hair (3 distinct styles for visual diversity)
  const hairStyle = pinNum % 3
  if (hairStyle === 0) {
    // Executive side-part / neat crop
    const hairCropGeo = new THREE.SphereGeometry(0.178, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.55)
    const hair = new THREE.Mesh(hairCropGeo, hairMat)
    hair.position.set(0, 0.03, 0)
    hair.rotation.x = -0.1
    headGroup.add(hair)

    // Side part sweep
    const sweepGeo = new THREE.BoxGeometry(0.18, 0.06, 0.12)
    const sweep = new THREE.Mesh(sweepGeo, hairMat)
    sweep.position.set(0.05, 0.14, -0.06)
    sweep.rotation.z = -0.15
    headGroup.add(sweep)
  } else if (hairStyle === 1) {
    // Textured fringe / pompadour
    const hairCapGeo = new THREE.SphereGeometry(0.18, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.52)
    const hairCap = new THREE.Mesh(hairCapGeo, hairMat)
    hairCap.position.set(0, 0.035, 0)
    headGroup.add(hairCap)

    const fringeGeo = new THREE.CylinderGeometry(0.14, 0.15, 0.08, 10)
    const fringe = new THREE.Mesh(fringeGeo, hairMat)
    fringe.position.set(0, 0.14, -0.05)
    fringe.rotation.x = -0.3
    headGroup.add(fringe)
  } else {
    // Elegant top bun / sleek bob
    const hairBobGeo = new THREE.SphereGeometry(0.182, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.6)
    const hairBob = new THREE.Mesh(hairBobGeo, hairMat)
    hairBob.position.set(0, 0.02, 0)
    headGroup.add(hairBob)

    const bunGeo = new THREE.SphereGeometry(0.08, 12, 12)
    const bun = new THREE.Mesh(bunGeo, hairMat)
    bun.position.set(0, 0.16, 0.12)
    headGroup.add(bun)
  }

  // 7. Articulated Left Arm (Shoulder -> Forearm -> Hand on Keyboard)
  const leftShoulder = new THREE.Group()
  leftShoulder.position.set(-0.21, 0.38, 0)
  torsoGroup.add(leftShoulder)

  const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.26, 8), clothesMat)
  leftUpperArm.position.set(0, -0.12, -0.04)
  leftUpperArm.rotation.x = 0.35
  leftShoulder.add(leftUpperArm)

  const leftElbow = new THREE.Group()
  leftElbow.position.set(0, -0.24, -0.08)
  leftShoulder.add(leftElbow)

  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 0.24, 8), clothesMat)
  leftForearm.position.set(0, 0.02, -0.12)
  leftForearm.rotation.x = -Math.PI / 2.3
  leftElbow.add(leftForearm)

  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), skinMat)
  leftHand.position.set(0, 0.02, -0.24)
  leftHand.userData = { entityId: entity.id }
  leftElbow.add(leftHand)

  // 8. Articulated Right Arm (Shoulder -> Forearm -> Hand on Keyboard / Mouse)
  const rightShoulder = new THREE.Group()
  rightShoulder.position.set(0.21, 0.38, 0)
  torsoGroup.add(rightShoulder)

  const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.26, 8), clothesMat)
  rightUpperArm.position.set(0, -0.12, -0.04)
  rightUpperArm.rotation.x = 0.35
  rightShoulder.add(rightUpperArm)

  const rightElbow = new THREE.Group()
  rightElbow.position.set(0, -0.24, -0.08)
  rightShoulder.add(rightElbow)

  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 0.24, 8), clothesMat)
  rightForearm.position.set(0, 0.02, -0.12)
  rightForearm.rotation.x = -Math.PI / 2.3
  rightElbow.add(rightForearm)

  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), skinMat)
  rightHand.position.set(0, 0.02, -0.24)
  rightHand.userData = { entityId: entity.id }
  rightElbow.add(rightHand)

  // 9. Floating Status Pin Indicator (Compact, elegant glow disk)
  const statusHalo = new THREE.Mesh(
    new THREE.RingGeometry(0.07, 0.11, 24),
    statusMat,
  )
  statusHalo.position.set(0, 1.05, 0)
  statusHalo.rotation.x = -Math.PI / 2
  statusHalo.userData = { entityId: entity.id }
  headGroup.add(statusHalo)

  // 10. Realistic Procedural Animation Function
  const baseTorsoY = 0.6
  const isWorking = entity.status === 'running' || entity.status === 'working'
  const isAwaiting = entity.status === 'awaiting_approval'
  const breathFreq = 1.3 + (seed % 0.4)
  const glanceFreq = 0.22 + ((seed * 3) % 0.15)

  const animate = (_delta: number, elapsed: number) => {
    // A. Natural Non-Synchronized Breathing (Multi-harmonic sine wave)
    const breath = Math.sin(elapsed * breathFreq + seed) * 0.007
      + Math.sin(elapsed * (breathFreq * 0.5) + seed) * 0.003
    torsoGroup.position.y = baseTorsoY + breath
    torso.rotation.x = Math.sin(elapsed * breathFreq + seed) * 0.012

    // B. Natural Gaze / Head Turning Between Dual Monitors
    // Smooth transitions between center screen, secondary screen and keyboard
    const glanceCycle = Math.sin(elapsed * glanceFreq + seed)
    const keyboardLook = Math.cos(elapsed * (glanceFreq * 1.7) + seed)

    if (isWorking) {
      // Focused worker shifts gaze between main display and side display
      headGroup.rotation.y = glanceCycle * 0.28
      headGroup.rotation.x = keyboardLook > 0.65 ? 0.14 : -0.04
      headGroup.rotation.z = 0

      // Active keystrokes (asymmetric micro-movements on forearms & hands)
      const typeLeft = Math.sin(elapsed * 13 + seed) * 0.035
      const typeRight = Math.cos(elapsed * 15 + seed) * 0.035
      leftElbow.rotation.x = typeLeft
      rightElbow.rotation.x = typeRight

      // Periodic shift of right hand to mouse (every ~7 seconds)
      const mouseCycle = Math.sin(elapsed * 0.9 + seed)
      if (mouseCycle > 0.3) {
        // Move right forearm slightly outward to mouse position
        rightShoulder.rotation.y = 0.18
        rightElbow.position.x = 0.08
        rightElbow.rotation.x = Math.sin(elapsed * 6) * 0.015 // mouse click micro-clicks
      } else {
        rightShoulder.rotation.y = 0
        rightElbow.position.x = 0
      }

      // Status indicator pulsing
      statusHalo.scale.setScalar(1 + Math.sin(elapsed * 3.5 + seed) * 0.15)
    } else if (isAwaiting) {
      // Thoughtful tilted posture waiting for approval
      headGroup.rotation.y = Math.sin(elapsed * 0.4 + seed) * 0.15
      headGroup.rotation.z = 0.12 // slight tilt
      headGroup.rotation.x = 0.05
      leftElbow.rotation.x = 0
      rightElbow.rotation.x = 0
      rightShoulder.rotation.y = 0
      rightElbow.position.x = 0
      statusHalo.scale.setScalar(1 + Math.sin(elapsed * 2) * 0.2)
    } else {
      // Idle / ready posture: relaxed, occasional glances around
      headGroup.rotation.y = glanceCycle * 0.18
      headGroup.rotation.x = 0
      headGroup.rotation.z = 0
      leftElbow.rotation.x = 0
      rightElbow.rotation.x = 0
      rightShoulder.rotation.y = 0
      rightElbow.position.x = 0
      statusHalo.scale.setScalar(1)
    }
  }

  // Set world position and orientation
  group.position.set(entity.position[0], entity.position[1], entity.position[2])
  if (entity.rotation) {
    group.rotation.set(entity.rotation[0], entity.rotation[1], entity.rotation[2])
  }

  return { group, animate }
}
