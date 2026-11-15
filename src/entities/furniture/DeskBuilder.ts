import * as THREE from 'three'
import type { MaterialPalette } from '../../engine/materials'

export function createModernWorkstation(
  materials: MaterialPalette,
  options: {
    entityId?: string
    topColor?: string
    dualMonitor?: boolean
    hasLaptop?: boolean
  } = {},
): THREE.Group {
  const group = new THREE.Group()
  if (options.entityId) {
    group.userData = { entityId: options.entityId }
  }

  const desktopMat = materials.getDeskTopMaterial(options.topColor || '#f8fafc')
  const legMat = materials.getMetalLegMaterial()
  const bezelMat = materials.getMonitorBezelMaterial()
  const screenMat1 = materials.getMonitorScreenMaterial('dashboard')
  const screenMat2 = materials.getMonitorScreenMaterial('code')
  const chairMat = materials.getLeatherMaterial('#334155')
  const shadowMat = materials.getContactShadowMaterial()

  // 0. Contact Ambient Occlusion Drop Shadows (grounds furniture on floor)
  const deskShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.1), shadowMat)
  deskShadow.rotation.x = -Math.PI / 2
  deskShadow.position.set(0, 0.003, 0)
  group.add(deskShadow)

  const chairShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), shadowMat)
  chairShadow.rotation.x = -Math.PI / 2
  chairShadow.position.set(0, 0.003, 0.48)
  group.add(chairShadow)

  // 1. Desktop surface (1.6m x 0.8m x 0.04m)
  const topGeo = new THREE.BoxGeometry(1.6, 0.04, 0.8)
  const topMesh = new THREE.Mesh(topGeo, desktopMat)
  topMesh.position.set(0, 0.74, 0)
  topMesh.castShadow = true
  topMesh.receiveShadow = true
  if (options.entityId) topMesh.userData = { entityId: options.entityId }
  group.add(topMesh)

  // 2. Desk Legs (Modern metal legs)
  const legGeo = new THREE.BoxGeometry(0.06, 0.72, 0.7)
  const leftLeg = new THREE.Mesh(legGeo, legMat)
  leftLeg.position.set(-0.7, 0.36, 0)
  leftLeg.castShadow = true
  if (options.entityId) leftLeg.userData = { entityId: options.entityId }
  group.add(leftLeg)

  const rightLeg = new THREE.Mesh(legGeo, legMat)
  rightLeg.position.set(0.7, 0.36, 0)
  rightLeg.castShadow = true
  if (options.entityId) rightLeg.userData = { entityId: options.entityId }
  group.add(rightLeg)

  // 3. Ergonomic Office Chair
  const chairGroup = new THREE.Group()
  chairGroup.position.set(0, 0, 0.48)
  if (options.entityId) chairGroup.userData = { entityId: options.entityId }

  // Seat
  const seatGeo = new THREE.BoxGeometry(0.48, 0.08, 0.46)
  const seat = new THREE.Mesh(seatGeo, chairMat)
  seat.position.set(0, 0.46, 0)
  seat.castShadow = true
  if (options.entityId) seat.userData = { entityId: options.entityId }
  chairGroup.add(seat)

  // Backrest
  const backGeo = new THREE.BoxGeometry(0.46, 0.52, 0.06)
  const back = new THREE.Mesh(backGeo, chairMat)
  back.position.set(0, 0.74, 0.2)
  back.rotation.x = -0.1
  back.castShadow = true
  if (options.entityId) back.userData = { entityId: options.entityId }
  chairGroup.add(back)

  // Base stand & wheels
  const standGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8)
  const stand = new THREE.Mesh(standGeo, legMat)
  stand.position.set(0, 0.21, 0)
  chairGroup.add(stand)

  group.add(chairGroup)

  // 4. Primary Monitor
  const monitorGroup = new THREE.Group()
  monitorGroup.position.set(options.dualMonitor ? -0.28 : 0, 0.76, -0.22)

  // Stand
  const mStandGeo = new THREE.BoxGeometry(0.04, 0.28, 0.04)
  const mStand = new THREE.Mesh(mStandGeo, legMat)
  mStand.position.set(0, 0.14, 0)
  monitorGroup.add(mStand)

  const mBaseGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.015, 16)
  const mBase = new THREE.Mesh(mBaseGeo, legMat)
  mBase.position.set(0, 0.01, 0)
  monitorGroup.add(mBase)

  // Screen frame
  const frameGeo = new THREE.BoxGeometry(0.68, 0.4, 0.03)
  const frame = new THREE.Mesh(frameGeo, bezelMat)
  frame.position.set(0, 0.32, 0)
  frame.castShadow = true
  if (options.entityId) frame.userData = { entityId: options.entityId }
  monitorGroup.add(frame)

  // Screen display
  const dispGeo = new THREE.PlaneGeometry(0.64, 0.36)
  const disp = new THREE.Mesh(dispGeo, screenMat1)
  disp.position.set(0, 0.32, 0.016)
  if (options.entityId) disp.userData = { entityId: options.entityId }
  monitorGroup.add(disp)

  group.add(monitorGroup)

  // 5. Secondary Monitor (Dual Monitor Setup)
  if (options.dualMonitor) {
    const monitor2 = new THREE.Group()
    monitor2.position.set(0.35, 0.76, -0.2)
    monitor2.rotation.y = -Math.PI / 8

    const m2Stand = new THREE.Mesh(mStandGeo, legMat)
    m2Stand.position.set(0, 0.14, 0)
    monitor2.add(m2Stand)

    const m2Base = new THREE.Mesh(mBaseGeo, legMat)
    m2Base.position.set(0, 0.01, 0)
    monitor2.add(m2Base)

    const m2Frame = new THREE.Mesh(frameGeo, bezelMat)
    m2Frame.position.set(0, 0.32, 0)
    m2Frame.castShadow = true
    if (options.entityId) m2Frame.userData = { entityId: options.entityId }
    monitor2.add(m2Frame)

    const m2Disp = new THREE.Mesh(dispGeo, screenMat2)
    m2Disp.position.set(0, 0.32, 0.016)
    if (options.entityId) m2Disp.userData = { entityId: options.entityId }
    monitor2.add(m2Disp)

    group.add(monitor2)
  }

  // 6. Laptop (if enabled)
  if (options.hasLaptop) {
    const laptopGroup = new THREE.Group()
    laptopGroup.position.set(0.48, 0.76, -0.05)
    laptopGroup.rotation.y = -Math.PI / 6

    const baseG = new THREE.BoxGeometry(0.3, 0.015, 0.2)
    const baseM = new THREE.Mesh(baseG, bezelMat)
    baseM.position.set(0, 0.007, 0)
    if (options.entityId) baseM.userData = { entityId: options.entityId }
    laptopGroup.add(baseM)

    const screenG = new THREE.BoxGeometry(0.3, 0.2, 0.01)
    const scrM = new THREE.Mesh(screenG, bezelMat)
    scrM.position.set(0, 0.1, -0.1)
    scrM.rotation.x = -Math.PI / 12
    if (options.entityId) scrM.userData = { entityId: options.entityId }
    laptopGroup.add(scrM)

    group.add(laptopGroup)
  }

  // 7. Keyboard & Mouse
  const kbGeo = new THREE.BoxGeometry(0.42, 0.01, 0.14)
  const kb = new THREE.Mesh(kbGeo, bezelMat)
  kb.position.set(0, 0.765, 0.08)
  if (options.entityId) kb.userData = { entityId: options.entityId }
  group.add(kb)

  const mouseGeo = new THREE.BoxGeometry(0.06, 0.015, 0.1)
  const mouse = new THREE.Mesh(mouseGeo, bezelMat)
  mouse.position.set(0.3, 0.765, 0.08)
  if (options.entityId) mouse.userData = { entityId: options.entityId }
  group.add(mouse)

  // 8. Ceramic Coffee Mug
  const mugGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.08, 12)
  const mugMat = materials.getWallMaterial('#ffffff')
  const mug = new THREE.Mesh(mugGeo, mugMat)
  mug.position.set(-0.55, 0.8, -0.1)
  group.add(mug)

  return group
}

export function createExecutiveDesk(
  materials: MaterialPalette,
  options: { entityId?: string } = {},
): THREE.Group {
  const group = new THREE.Group()
  if (options.entityId) group.userData = { entityId: options.entityId }

  const woodMat = materials.getExecutiveWoodMaterial()
  const chairMat = materials.getLeatherMaterial('#0f172a')
  const bezelMat = materials.getMonitorBezelMaterial()
  const screenMat = materials.getMonitorScreenMaterial('charts')
  const shadowMat = materials.getContactShadowMaterial()

  // Contact Ambient Occlusion Drop Shadow
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.4), shadowMat)
  shadow.rotation.x = -Math.PI / 2
  shadow.position.set(0, 0.003, 0)
  group.add(shadow)

  const chairShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), shadowMat)
  chairShadow.rotation.x = -Math.PI / 2
  chairShadow.position.set(0, 0.003, 0.65)
  group.add(chairShadow)

  // Main Executive Table (2.2m x 0.9m)
  const mainGeo = new THREE.BoxGeometry(2.2, 0.08, 0.9)
  const mainTop = new THREE.Mesh(mainGeo, woodMat)
  mainTop.position.set(0, 0.74, 0)
  mainTop.castShadow = true
  if (options.entityId) mainTop.userData = { entityId: options.entityId }
  group.add(mainTop)

  // Solid Pedestal Bases
  const baseLGeo = new THREE.BoxGeometry(0.3, 0.7, 0.8)
  const baseL = new THREE.Mesh(baseLGeo, woodMat)
  baseL.position.set(-0.85, 0.35, 0)
  baseL.castShadow = true
  if (options.entityId) baseL.userData = { entityId: options.entityId }
  group.add(baseL)

  const baseR = baseL.clone()
  baseR.position.set(0.85, 0.35, 0)
  group.add(baseR)

  // High-back Executive Leather Chair
  const chair = new THREE.Group()
  chair.position.set(0, 0, 0.65)
  if (options.entityId) chair.userData = { entityId: options.entityId }

  const seatGeo = new THREE.BoxGeometry(0.58, 0.1, 0.54)
  const seat = new THREE.Mesh(seatGeo, chairMat)
  seat.position.set(0, 0.48, 0)
  if (options.entityId) seat.userData = { entityId: options.entityId }
  chair.add(seat)

  const backGeo = new THREE.BoxGeometry(0.56, 0.8, 0.08)
  const back = new THREE.Mesh(backGeo, chairMat)
  back.position.set(0, 0.88, 0.22)
  back.rotation.x = -0.1
  if (options.entityId) back.userData = { entityId: options.entityId }
  chair.add(back)

  group.add(chair)

  // Executive Curved Ultrawide Display
  const screenGeo = new THREE.BoxGeometry(1.1, 0.45, 0.04)
  const screen = new THREE.Mesh(screenGeo, bezelMat)
  screen.position.set(0, 1.08, -0.2)
  screen.castShadow = true
  if (options.entityId) screen.userData = { entityId: options.entityId }
  group.add(screen)

  const dispGeo = new THREE.PlaneGeometry(1.06, 0.41)
  const disp = new THREE.Mesh(dispGeo, screenMat)
  disp.position.set(0, 1.08, -0.178)
  if (options.entityId) disp.userData = { entityId: options.entityId }
  group.add(disp)

  return group
}

export function createConferenceTable(materials: MaterialPalette): THREE.Group {
  const group = new THREE.Group()

  const woodMat = materials.getExecutiveWoodMaterial()
  const legMat = materials.getMetalLegMaterial()
  const chairMat = materials.getLeatherMaterial('#334155')
  const shadowMat = materials.getContactShadowMaterial()

  // Contact Ambient Occlusion Drop Shadow
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.4), shadowMat)
  shadow.rotation.x = -Math.PI / 2
  shadow.position.set(0, 0.003, 0)
  group.add(shadow)

  // Large Conference Table (4.5m x 1.6m)
  const tableGeo = new THREE.BoxGeometry(4.5, 0.08, 1.6)
  const table = new THREE.Mesh(tableGeo, woodMat)
  table.position.set(0, 0.74, 0)
  table.castShadow = true
  table.receiveShadow = true
  group.add(table)

  // Center cable tray
  const trayGeo = new THREE.BoxGeometry(2.0, 0.01, 0.2)
  const trayMat = materials.getFrameMaterial('#0f172a')
  const tray = new THREE.Mesh(trayGeo, trayMat)
  tray.position.set(0, 0.785, 0)
  group.add(tray)

  // Heavy pillars
  const pillarGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.7, 16)
  const p1 = new THREE.Mesh(pillarGeo, legMat)
  p1.position.set(-1.4, 0.35, 0)
  group.add(p1)

  const p2 = new THREE.Mesh(pillarGeo, legMat)
  p2.position.set(1.4, 0.35, 0)
  group.add(p2)

  // Surround chairs
  const addChair = (x: number, z: number, rotY: number) => {
    const ch = new THREE.Group()
    ch.position.set(x, 0, z)
    ch.rotation.y = rotY

    const s = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.44), chairMat)
    s.position.set(0, 0.46, 0)
    ch.add(s)

    const b = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.5, 0.06), chairMat)
    b.position.set(0, 0.73, 0.19)
    b.rotation.x = -0.1
    ch.add(b)

    group.add(ch)
  }

  // North side
  addChair(-1.3, -1.05, 0)
  addChair(0, -1.05, 0)
  addChair(1.3, -1.05, 0)

  // South side
  addChair(-1.3, 1.05, Math.PI)
  addChair(0, 1.05, Math.PI)
  addChair(1.3, 1.05, Math.PI)

  // Heads
  addChair(-2.55, 0, Math.PI / 2)
  addChair(2.55, 0, -Math.PI / 2)

  return group
}
