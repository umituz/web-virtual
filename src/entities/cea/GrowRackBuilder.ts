import * as THREE from 'three'
import type { WorldTickFn, UnregisterTick } from '../../core/types'
import { createRng } from '../../engine/random'
import { createLedBar, type LedSpectrum } from './LedBarBuilder'

export interface RackTrayOptions {
  growth?: number
  plantColor?: string
  spacing?: number
}

export interface RackLedOptions {
  spectrum?: LedSpectrum
  intensity?: number
  periodSeconds?: number
  onFraction?: number
  castLight?: boolean
}

export interface GrowRackOptions {
  width?: number
  depth?: number
  tiers?: number
  tierHeight?: number
  frameColor?: string
  trayColor?: string
  trays?: RackTrayOptions | false
  led?: RackLedOptions | false
  registerTick?: (fn: WorldTickFn) => UnregisterTick
}

export function createGrowRack(options: GrowRackOptions = {}): THREE.Group {
  const width = options.width ?? 4
  const depth = options.depth ?? 1.2
  const tiers = Math.max(1, options.tiers ?? 4)
  const tierHeight = options.tierHeight ?? 1.1
  const frameColor = options.frameColor ?? '#64748b'
  const trayColor = options.trayColor ?? '#e2e8f0'
  const totalHeight = tiers * tierHeight

  const group = new THREE.Group()

  const frameMaterial = new THREE.MeshStandardMaterial({ color: frameColor, metalness: 0.55, roughness: 0.45 })
  const postGeometry = new THREE.BoxGeometry(0.08, totalHeight, 0.08)
  const postAnchors: [number, number][] = [
    [-width / 2 + 0.06, depth / 2 - 0.06],
    [width / 2 - 0.06, depth / 2 - 0.06],
    [-width / 2 + 0.06, -depth / 2 + 0.06],
    [width / 2 - 0.06, -depth / 2 + 0.06],
  ]
  for (const [x, z] of postAnchors) {
    const post = new THREE.Mesh(postGeometry, frameMaterial)
    post.position.set(x, totalHeight / 2, z)
    group.add(post)
  }

  const trayMaterial = new THREE.MeshStandardMaterial({ color: trayColor, metalness: 0.15, roughness: 0.7 })
  const trayGeometry = new THREE.BoxGeometry(width - 0.08, 0.07, depth - 0.04)

  const trayConfig: RackTrayOptions | false = options.trays === undefined ? {} : options.trays
  const growth = trayConfig === false ? 0 : Math.min(1, Math.max(0, trayConfig.growth ?? 0.6))
  const plantColor = trayConfig === false ? '#22c55e' : (trayConfig.plantColor ?? '#22c55e')
  const spacing = trayConfig === false ? 0.35 : (trayConfig.spacing ?? 0.32)

  const cols = Math.max(1, Math.floor((width - 0.3) / spacing))
  const rows = Math.max(1, Math.floor((depth - 0.15) / (spacing * 0.8)))
  const perTier = cols * rows
  const totalCount = perTier * tiers
  const rng = createRng(31)

  const stemGeometry = new THREE.CylinderGeometry(0.014, 0.024, 1, 5)
  const stemMaterial = new THREE.MeshStandardMaterial({ color: '#4d7c0f', roughness: 0.8 })
  const canopyGeometry = new THREE.ConeGeometry(0.11, 0.26, 6)
  const canopyMaterial = new THREE.MeshStandardMaterial({ color: plantColor, roughness: 0.65 })
  const stems = new THREE.InstancedMesh(stemGeometry, stemMaterial, totalCount)
  const canopies = new THREE.InstancedMesh(canopyGeometry, canopyMaterial, totalCount)
  stems.castShadow = true
  canopies.castShadow = true

  const dummy = new THREE.Object3D()
  const stemHeightFor = (base: number): number => 0.12 + base * 0.5

  let index = 0
  for (let tier = 0; tier < tiers; tier += 1) {
    const tray = new THREE.Mesh(trayGeometry, trayMaterial)
    tray.position.set(0, (tier + 1) * tierHeight - 0.04, 0)
    tray.receiveShadow = true
    group.add(tray)

    if (options.led !== false) {
      const led = createLedBar({
        length: width - 0.3,
        spectrum: options.led?.spectrum ?? (tier % 2 === 0 ? 'vegetative' : 'full'),
        intensity: options.led?.intensity,
        periodSeconds: options.led?.periodSeconds,
        onFraction: options.led?.onFraction,
        castLight: options.led?.castLight ?? false,
        registerTick: options.registerTick,
      })
      led.position.set(0, (tier + 1) * tierHeight + 0.16, depth / 2 - 0.12)
      group.add(led)
    }

    if (trayConfig !== false) {
      const trayY = (tier + 1) * tierHeight
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const localGrowth = Math.min(1, Math.max(0.05, growth + (rng() - 0.5) * 0.18))
          const x = -((cols - 1) * spacing) / 2 + col * spacing
          const z = -((rows - 1) * spacing * 0.8) / 2 + row * spacing * 0.8
          const stemH = stemHeightFor(localGrowth)

          dummy.position.set(x, trayY + stemH / 2, z)
          dummy.scale.set(1, stemH, 1)
          dummy.rotation.set(0, 0, 0)
          dummy.updateMatrix()
          stems.setMatrixAt(index, dummy.matrix)

          dummy.position.set(x, trayY + stemH + 0.1 * localGrowth, z)
          dummy.scale.setScalar(0.35 + localGrowth * 0.9)
          dummy.rotation.set(0, rng() * Math.PI, 0)
          dummy.updateMatrix()
          canopies.setMatrixAt(index, dummy.matrix)

          index += 1
        }
      }
    }
  }

  if (trayConfig !== false) {
    stems.count = index
    canopies.count = index
    group.add(stems)
    group.add(canopies)
  }

  return group
}
