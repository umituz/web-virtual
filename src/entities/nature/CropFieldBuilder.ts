import * as THREE from 'three'
import { createRng } from '../../engine/random'

/**
 * Procedural crop plot — a raised soil bed with instanced crop rows whose
 * height, density and color respond to a `growth` value between 0 (bare
 * soil) and 1 (harvest-ready). One InstancedMesh per plot keeps draw calls
 * flat no matter how dense the planting is.
 */

export interface CropPlotOptions {
  /** Plot size in meters along x. */
  width?: number
  /** Plot size in meters along z. */
  depth?: number
  /** Number of crop rows (along the width axis). */
  rows?: number
  /** Row length direction the plants are spaced along. */
  rowDirection?: 'x' | 'z'
  soilColor?: string
  /** Foliage color of the crop. */
  cropColor?: string
  /** 0..1 — scales plant height and thinning. */
  growth?: number
  /** Raised soil bed height in meters. */
  soilHeight?: number
  /** Deterministic scatter seed. */
  seed?: number
  /** Links the whole plot to an entity for raycast selection. */
  entityId?: string
}

const MIN_PLANT_HEIGHT = 0.06
const MAX_PLANT_HEIGHT = 0.85

export function createCropPlot(options: CropPlotOptions = {}): THREE.Group {
  const {
    width = 8,
    depth = 6,
    rows = 5,
    rowDirection = 'z',
    soilColor = '#4a3c28',
    cropColor = '#4d7c0f',
    growth = 0.6,
    soilHeight = 0.22,
    seed = 7,
    entityId,
  } = options

  const g = THREE.MathUtils.clamp(growth, 0, 1)
  const group = new THREE.Group()
  group.name = 'crop-plot'
  if (entityId) group.userData = { entityId }

  // 1. Raised soil bed
  const soilMat = new THREE.MeshStandardMaterial({ color: soilColor, roughness: 0.96 })
  const soil = new THREE.Mesh(new THREE.BoxGeometry(width, soilHeight, depth), soilMat)
  soil.position.y = soilHeight / 2
  soil.receiveShadow = true
  soil.castShadow = false
  if (entityId) soil.userData = { entityId }
  group.add(soil)

  // 2. Crop rows — plants per row scales with the plot's longer axis
  const rng = createRng(seed)
  const spacing = 0.55
  const rowCount = Math.max(1, Math.round(rows * (0.35 + 0.65 * g)))

  const rowAxis = rowDirection === 'x' ? 'x' : 'z'
  const rowLength = rowAxis === 'x' ? width : depth
  const crossLength = rowAxis === 'x' ? depth : width

  const perRow = Math.max(2, Math.floor((rowLength - 1) / spacing))
  const plantHeight = MIN_PLANT_HEIGHT + (MAX_PLANT_HEIGHT - MIN_PLANT_HEIGHT) * g

  // Low-poly plant: a slim cone (stalk + foliage reads as one silhouette)
  const plantGeo = new THREE.ConeGeometry(0.14, 1, 5)
  plantGeo.translate(0, 0.5, 0) // pivot at the base so scale.y grows upward
  const plantMat = new THREE.MeshStandardMaterial({ color: cropColor, roughness: 0.9 })

  const instanced = new THREE.InstancedMesh(plantGeo, plantMat, rowCount * perRow)
  instanced.name = 'crop-plants'
  instanced.castShadow = g > 0.25
  instanced.receiveShadow = false

  const dummy = new THREE.Object3D()
  const color = new THREE.Color()
  const hsl = { h: 0, s: 0, l: 0 }
  color.set(cropColor).getHSL(hsl)

  let index = 0
  for (let r = 0; r < rowCount; r++) {
    const crossPos = (r + 0.5) * (crossLength / rowCount) - crossLength / 2
    for (let p = 0; p < perRow; p++) {
      const rowPos = -rowLength / 2 + 0.5 + p * spacing + (rng() - 0.5) * 0.18
      const h = plantHeight * (0.75 + rng() * 0.5)
      const w = 0.8 + rng() * 0.5

      if (rowAxis === 'x') {
        dummy.position.set(rowPos, soilHeight, crossPos)
      } else {
        dummy.position.set(crossPos, soilHeight, rowPos)
      }
      dummy.rotation.set(0, rng() * Math.PI * 2, 0)
      dummy.scale.set(w, h, w)
      dummy.updateMatrix()
      instanced.setMatrixAt(index, dummy.matrix)

      // Slight per-plant lightness jitter for an organic patchwork
      const l = THREE.MathUtils.clamp(hsl.l + (rng() - 0.5) * 0.14, 0.05, 0.9)
      color.setHSL(hsl.h, hsl.s, l)
      instanced.setColorAt(index, color)
      index++
    }
  }
  instanced.count = index
  instanced.instanceMatrix.needsUpdate = true
  if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true
  group.add(instanced)

  return group
}
