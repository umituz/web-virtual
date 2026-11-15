import * as THREE from 'three'
import type { MaterialPalette } from '../../engine/materials'
import type { WorldTheme } from '../../core/types'

export interface ArchitectureOptions {
  width: number
  depth: number
  theme?: WorldTheme
}

export function buildOfficeArchitecture(
  materials: MaterialPalette,
  options: ArchitectureOptions,
): THREE.Group {
  const root = new THREE.Group()
  root.name = 'office-architecture'

  const tileMat = materials.getTileFloor(options.theme?.floorColor || '#e2e8f0')
  const woodMat = materials.getWoodParquet(options.theme?.woodFloorColor || '#b48a58')
  const frameMat = materials.getFrameMaterial(options.theme?.wallFrameColor || '#0f172a')
  const glassMat = materials.getGlassMaterial(
    options.theme?.glassColor || '#93c5fd',
    options.theme?.glassOpacity ?? 0.28,
  )

  const W = options.width || 36
  const D = options.depth || 20

  // 1. Flooring
  // Left 65% = Open office tiles
  const openW = W * 0.65
  const floorOpen = new THREE.Mesh(new THREE.PlaneGeometry(openW, D), tileMat)
  floorOpen.rotation.x = -Math.PI / 2
  floorOpen.position.set(-W / 2 + openW / 2, 0, 0)
  floorOpen.receiveShadow = true
  root.add(floorOpen)

  // Right 35% = Executive & Meeting Wood Parquet
  const execW = W * 0.35
  const floorExec = new THREE.Mesh(new THREE.PlaneGeometry(execW, D), woodMat)
  floorExec.rotation.x = -Math.PI / 2
  floorExec.position.set(W / 2 - execW / 2, 0.002, 0) // slightly offset to prevent z-fighting
  floorExec.receiveShadow = true
  root.add(floorExec)

  // Subtle floor grid on open area
  const gridHelper = new THREE.GridHelper(openW, Math.round(openW / 2), 0x94a3b8, 0xcbd5e1)
  gridHelper.position.set(-W / 2 + openW / 2, 0.004, 0)
  root.add(gridHelper)

  // 2. Outer Perimeter Glass Walls & Dark Structural Columns
  const H = 3.6

  // Helper for framed glass panel
  const createGlassWall = (width: number, height: number): THREE.Group => {
    const wallGroup = new THREE.Group()

    // Glass sheet
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(width, height), glassMat)
    glass.position.set(0, height / 2, 0)
    wallGroup.add(glass)

    // Bottom rail
    const botRail = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.06), frameMat)
    botRail.position.set(0, 0.04, 0)
    botRail.castShadow = true
    wallGroup.add(botRail)

    // Top rail
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.06), frameMat)
    topRail.position.set(0, height - 0.04, 0)
    topRail.castShadow = true
    wallGroup.add(topRail)

    // Vertical Mullions every 3 meters
    const mullionCount = Math.max(1, Math.floor(width / 3))
    const step = width / (mullionCount + 1)
    for (let i = 1; i <= mullionCount; i++) {
      const mul = new THREE.Mesh(new THREE.BoxGeometry(0.06, height, 0.08), frameMat)
      mul.position.set(-width / 2 + i * step, height / 2, 0)
      mul.castShadow = true
      wallGroup.add(mul)
    }

    return wallGroup
  }

  // North Perimeter Wall
  const northWall = createGlassWall(W, H)
  northWall.position.set(0, 0, -D / 2)
  root.add(northWall)

  // South Perimeter Wall (Lower front wall for unobstructed view, 1.2m)
  const southWall = createGlassWall(W, 1.2)
  southWall.position.set(0, 0, D / 2)
  root.add(southWall)

  // West Perimeter Wall
  const westWall = createGlassWall(D, H)
  westWall.rotation.y = Math.PI / 2
  westWall.position.set(-W / 2, 0, 0)
  root.add(westWall)

  // East Perimeter Wall
  const eastWall = createGlassWall(D, H)
  eastWall.rotation.y = -Math.PI / 2
  eastWall.position.set(W / 2, 0, 0)
  root.add(eastWall)

  // 3. Central Dividing Glass Partition (between Open Office & Executive Wood Wing)
  const dividerX = -W / 2 + openW
  const divWall = createGlassWall(D, H)
  divWall.rotation.y = Math.PI / 2
  divWall.position.set(dividerX, 0, 0)
  root.add(divWall)

  // 4. Executive Suite Separation Wall (splitting Meeting Room and CEO Suite)
  const execSplit = createGlassWall(execW, H)
  execSplit.position.set(W / 2 - execW / 2, 0, -1)
  root.add(execSplit)

  // 5. Cubicle Partitions for Open Office (Modern frosted glass / fabric dividers)
  const cubicleDividerMat = materials.getGlassMaterial('#bfdbfe', 0.45)
  const createCubicleDivider = (len: number): THREE.Group => {
    const cubGroup = new THREE.Group()
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(len, 1.25, 0.04), cubicleDividerMat)
    sheet.position.set(0, 0.625, 0)
    sheet.castShadow = true
    cubGroup.add(sheet)

    const topCap = new THREE.Mesh(new THREE.BoxGeometry(len, 0.04, 0.05), frameMat)
    topCap.position.set(0, 1.25, 0)
    cubGroup.add(topCap)
    return cubGroup
  }

  // Row 1 divider
  const c1 = createCubicleDivider(12)
  c1.position.set(-W / 2 + 8, 0, -5.2)
  root.add(c1)

  // Row 2 divider
  const c2 = createCubicleDivider(12)
  c2.position.set(-W / 2 + 8, 0, -0.2)
  root.add(c2)

  // Row 3 divider
  const c3 = createCubicleDivider(12)
  c3.position.set(-W / 2 + 8, 0, 4.8)
  root.add(c3)

  // 6. Presentation Digital Whiteboard / Monitor in Conference Room
  const boardGroup = new THREE.Group()
  boardGroup.position.set(W / 2 - 0.1, 1.8, 4.5)
  boardGroup.rotation.y = -Math.PI / 2

  const boardFrame = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 1.8, 0.06),
    materials.getFrameMaterial('#0f172a'),
  )
  boardGroup.add(boardFrame)

  const boardScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 1.7),
    materials.getMonitorScreenMaterial(true, '#1e3a8a'),
  )
  boardScreen.position.set(0, 0, 0.032)
  boardGroup.add(boardScreen)
  root.add(boardGroup)

  return root
}
