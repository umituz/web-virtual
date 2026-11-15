import * as THREE from 'three'
import type { MaterialPalette } from '../../engine/materials'
import { ModelLoader } from '../../engine/modelLoader'

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

  const shadowMat = materials.getContactShadowMaterial()
  const screenMat1 = materials.getMonitorScreenMaterial('dashboard')
  const screenMat2 = materials.getMonitorScreenMaterial('code')

  // 0. Contact Ambient Occlusion Drop Shadows (grounds furniture on floor)
  const deskShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.1), shadowMat)
  deskShadow.rotation.x = -Math.PI / 2
  deskShadow.position.set(0, 0.003, 0)
  group.add(deskShadow)

  const chairShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), shadowMat)
  chairShadow.rotation.x = -Math.PI / 2
  chairShadow.position.set(0, 0.003, 0.48)
  group.add(chairShadow)

  // 1. Container for 3D Real Models
  const modelsContainer = new THREE.Group()
  modelsContainer.name = `workstation-models-${options.entityId || 'generic'}`
  group.add(modelsContainer)

  // 2. Fallback geometry group (shown instantly while 3D models load)
  const placeholderGroup = new THREE.Group()
  placeholderGroup.name = 'workstation-placeholder'

  const desktopMat = materials.getDeskTopMaterial(options.topColor || '#f8fafc')
  const legMat = materials.getMetalLegMaterial()
  const bezelMat = materials.getMonitorBezelMaterial()
  const chairMat = materials.getLeatherMaterial('#334155')

  const topMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.8), desktopMat)
  topMesh.position.set(0, 0.74, 0)
  topMesh.castShadow = true
  topMesh.receiveShadow = true
  if (options.entityId) topMesh.userData = { entityId: options.entityId }
  placeholderGroup.add(topMesh)

  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.7), legMat)
  leftLeg.position.set(-0.7, 0.36, 0)
  leftLeg.castShadow = true
  if (options.entityId) leftLeg.userData = { entityId: options.entityId }
  placeholderGroup.add(leftLeg)

  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.7), legMat)
  rightLeg.position.set(0.7, 0.36, 0)
  rightLeg.castShadow = true
  if (options.entityId) rightLeg.userData = { entityId: options.entityId }
  placeholderGroup.add(rightLeg)

  const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.46), chairMat)
  chairSeat.position.set(0, 0.46, 0.48)
  chairSeat.castShadow = true
  if (options.entityId) chairSeat.userData = { entityId: options.entityId }
  placeholderGroup.add(chairSeat)

  group.add(placeholderGroup)

  // 3. Asynchronously load and mount real 3D models from Asset Catalog
  const loader = ModelLoader.getInstance()
  void Promise.allSettled([
    loader.load('furniture:desk'),
    loader.load('furniture:chairDesk'),
    loader.load('equipment:screen'),
    options.dualMonitor ? loader.load('equipment:screen') : Promise.resolve(null),
    loader.load('equipment:keyboard'),
    loader.load('equipment:mouse'),
    options.hasLaptop ? loader.load('equipment:laptop') : Promise.resolve(null),
  ]).then((results) => {
    // If successfully loaded, replace placeholder with real models
    const deskModel = results[0].status === 'fulfilled' ? results[0].value : null
    const chairModel = results[1].status === 'fulfilled' ? results[1].value : null
    const screenModel1 = results[2].status === 'fulfilled' ? results[2].value : null
    const screenModel2 = results[3].status === 'fulfilled' ? results[3].value : null
    const kbModel = results[4].status === 'fulfilled' ? results[4].value : null
    const mouseModel = results[5].status === 'fulfilled' ? results[5].value : null
    const laptopModel = results[6].status === 'fulfilled' ? results[6].value : null

    if (deskModel) {
      placeholderGroup.visible = false

      // Real Desk
      deskModel.scale.set(2.0, 1.95, 2.0)
      deskModel.position.set(-0.7, 0, 0.38)
      deskModel.traverse((node) => {
        if (options.entityId) node.userData = { entityId: options.entityId }
      })
      modelsContainer.add(deskModel)

      // Real Chair
      if (chairModel) {
        chairModel.scale.set(2.2, 2.2, 2.2)
        chairModel.position.set(-0.35, 0, 0.65)
        chairModel.rotation.y = Math.PI
        chairModel.traverse((node) => {
          if (options.entityId) node.userData = { entityId: options.entityId }
        })
        modelsContainer.add(chairModel)
      }

      // Real Primary Screen
      if (screenModel1) {
        screenModel1.scale.set(1.5, 1.5, 1.5)
        screenModel1.position.set(options.dualMonitor ? -0.28 : 0, 0.74, -0.2)
        screenModel1.traverse((node) => {
          if (options.entityId) node.userData = { entityId: options.entityId }
        })

        // Overlay glowing dashboard screen plane
        const disp1 = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.34), screenMat1)
        disp1.position.set(options.dualMonitor ? -0.28 : 0, 0.98, -0.19)
        if (options.entityId) disp1.userData = { entityId: options.entityId }
        modelsContainer.add(disp1)
        modelsContainer.add(screenModel1)
      }

      // Real Secondary Screen (Dual Monitor Setup)
      if (screenModel2) {
        screenModel2.scale.set(1.5, 1.5, 1.5)
        screenModel2.position.set(0.35, 0.74, -0.18)
        screenModel2.rotation.y = -Math.PI / 7
        screenModel2.traverse((node) => {
          if (options.entityId) node.userData = { entityId: options.entityId }
        })

        // Overlay glowing code screen plane
        const disp2 = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.34), screenMat2)
        disp2.position.set(0.35, 0.98, -0.17)
        disp2.rotation.y = -Math.PI / 7
        if (options.entityId) disp2.userData = { entityId: options.entityId }
        modelsContainer.add(disp2)
        modelsContainer.add(screenModel2)
      }

      // Real Keyboard
      if (kbModel) {
        kbModel.scale.set(1.5, 1.5, 1.5)
        kbModel.position.set(0, 0.75, 0.08)
        kbModel.traverse((node) => {
          if (options.entityId) node.userData = { entityId: options.entityId }
        })
        modelsContainer.add(kbModel)
      }

      // Real Mouse
      if (mouseModel) {
        mouseModel.scale.set(1.4, 1.4, 1.4)
        mouseModel.position.set(0.28, 0.75, 0.08)
        mouseModel.traverse((node) => {
          if (options.entityId) node.userData = { entityId: options.entityId }
        })
        modelsContainer.add(mouseModel)
      }

      // Real Laptop
      if (laptopModel) {
        laptopModel.scale.set(0.9, 0.9, 0.9)
        laptopModel.position.set(0.5, 0.75, -0.05)
        laptopModel.rotation.y = -Math.PI / 6
        laptopModel.traverse((node) => {
          if (options.entityId) node.userData = { entityId: options.entityId }
        })
        modelsContainer.add(laptopModel)
      }
    }
  })

  // Ceramic Coffee Mug
  const mugGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.08, 12)
  const mugMat = materials.getWallMaterial('#ffffff')
  const mug = new THREE.Mesh(mugGeo, mugMat)
  mug.position.set(-0.55, 0.8, -0.1)
  if (options.entityId) mug.userData = { entityId: options.entityId }
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

  // Real 3D Corner Desk
  const modelsContainer = new THREE.Group()
  modelsContainer.name = 'executive-models'
  group.add(modelsContainer)

  const placeholderGroup = new THREE.Group()
  const mainTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.9), woodMat)
  mainTop.position.set(0, 0.74, 0)
  mainTop.castShadow = true
  if (options.entityId) mainTop.userData = { entityId: options.entityId }
  placeholderGroup.add(mainTop)
  group.add(placeholderGroup)

  const loader = ModelLoader.getInstance()
  void Promise.allSettled([
    loader.load('furniture:deskCorner'),
    loader.load('furniture:chairDesk'),
  ]).then(([deskRes, chairRes]) => {
    if (deskRes.status === 'fulfilled') {
      placeholderGroup.visible = false
      const deskCorner = deskRes.value
      deskCorner.scale.set(2.4, 2.0, 2.4)
      deskCorner.position.set(-1.0, 0, 0.7)
      deskCorner.traverse((node) => {
        if (options.entityId) node.userData = { entityId: options.entityId }
      })
      modelsContainer.add(deskCorner)

      if (chairRes.status === 'fulfilled') {
        const execChair = chairRes.value
        execChair.scale.set(2.5, 2.5, 2.5)
        execChair.position.set(-0.35, 0, 0.8)
        execChair.rotation.y = Math.PI
        execChair.traverse((node) => {
          if (options.entityId) node.userData = { entityId: options.entityId }
        })
        modelsContainer.add(execChair)
      }
    }
  })

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

  // Real 3D Conference Table
  const modelsContainer = new THREE.Group()
  group.add(modelsContainer)

  const placeholder = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.08, 1.6), woodMat)
  placeholder.position.set(0, 0.74, 0)
  placeholder.castShadow = true
  placeholder.receiveShadow = true
  group.add(placeholder)

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

  // Heavy pillars
  const pillarGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.7, 16)
  const p1 = new THREE.Mesh(pillarGeo, legMat)
  p1.position.set(-1.4, 0.35, 0)
  group.add(p1)

  const p2 = new THREE.Mesh(pillarGeo, legMat)
  p2.position.set(1.4, 0.35, 0)
  group.add(p2)

  return group
}
