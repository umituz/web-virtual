import * as THREE from 'three'

export interface LabShellOptions {
  width?: number
  depth?: number
  height?: number
  wallColor?: string
  floorColor?: string
  frameColor?: string
  panelColor?: string
  panels?: number
  observationWindow?: boolean
}

export function createLabShell(options: LabShellOptions = {}): THREE.Group {
  const width = options.width ?? 22
  const depth = options.depth ?? 14
  const height = options.height ?? 5.4
  const wallThickness = 0.16
  const wallColor = options.wallColor ?? '#e7edf5'
  const frameColor = options.frameColor ?? '#94a3b8'

  const group = new THREE.Group()

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: options.floorColor ?? '#dde5ee',
    metalness: 0.08,
    roughness: 0.5,
  })
  const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, depth), floorMaterial)
  floor.position.y = -0.06
  floor.receiveShadow = true
  group.add(floor)

  const grid = new THREE.GridHelper(Math.max(width, depth), Math.max(width, depth) / 2, frameColor, frameColor)
  ;(grid.material as THREE.Material).opacity = 0.16
  ;(grid.material as THREE.Material).transparent = true
  grid.position.y = 0.01
  group.add(grid)

  const wallMaterial = new THREE.MeshStandardMaterial({ color: wallColor, metalness: 0.05, roughness: 0.85 })

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, wallThickness), wallMaterial)
  backWall.position.set(0, height / 2, -depth / 2 + wallThickness / 2)
  backWall.receiveShadow = true
  group.add(backWall)

  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, height, depth), wallMaterial)
    wall.position.set((side * (width - wallThickness)) / 2, height / 2, 0)
    wall.receiveShadow = true
    group.add(wall)
  }

  if (options.observationWindow !== false) {
    const windowWidth = Math.min(width * 0.5, 7)
    const windowHeight = height * 0.42
    const window = new THREE.Mesh(
      new THREE.BoxGeometry(windowWidth, windowHeight, wallThickness * 0.5),
      new THREE.MeshStandardMaterial({
        color: '#a5d8f3',
        transparent: true,
        opacity: 0.3,
        metalness: 0.2,
        roughness: 0.05,
      }),
    )
    window.position.set(0, height * 0.55, -depth / 2 + wallThickness)
    group.add(window)

    const frameMaterial = new THREE.MeshStandardMaterial({ color: frameColor, metalness: 0.5, roughness: 0.4 })
    for (const dy of [-windowHeight / 2, windowHeight / 2]) {
      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(windowWidth + 0.3, 0.14, wallThickness * 0.9),
        frameMaterial,
      )
      trim.position.set(0, height * 0.55 + dy, -depth / 2 + wallThickness)
      group.add(trim)
    }
  }

  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.14, depth),
    new THREE.MeshStandardMaterial({ color: wallColor, metalness: 0.05, roughness: 0.9 }),
  )
  ceiling.position.y = height + 0.07
  group.add(ceiling)

  const panelCount = options.panels ?? 5
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: options.panelColor ?? '#f8fafc',
    emissive: new THREE.Color(options.panelColor ?? '#f8fafc'),
    emissiveIntensity: 0.85,
    roughness: 0.4,
  })
  const panelWidth = (width - 1.2) / (panelCount * 1.4)
  for (let i = 0; i < panelCount; i += 1) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(panelWidth, 0.05, depth * 0.34), panelMaterial)
    panel.position.set(-width / 2 + 1 + i * ((width - 2) / Math.max(1, panelCount - 1)), height - 0.03, 0)
    group.add(panel)
  }

  return group
}
