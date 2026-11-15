import * as THREE from 'three'
import type { WorldPreset, WorldSlot, WorldZone } from '../core/types'
import { MaterialPalette } from '../engine/materials'

export const DEFAULT_FARM_ZONES: WorldZone[] = [
  {
    id: 'greenhouse',
    name: 'Hydroponics & Greenhouse',
    color: '#22c55e',
    description: 'Automated irrigation and climate-controlled greenhouse area.',
    cameraFocus: [-8, 1, -5],
  },
  {
    id: 'crop_fields',
    name: 'Open Crop Fields',
    color: '#84cc16',
    description: 'Seasonal organic crop plots.',
    cameraFocus: [6, 0.5, -4],
  },
  {
    id: 'barn_storage',
    name: 'Logistics Hangar & Storage',
    color: '#b45309',
    description: 'Harvest collection, packaging and tractor parking area.',
    cameraFocus: [0, 1.5, 6],
  },
]

export const FARM_SLOTS: WorldSlot[] = [
  { id: 'slot-1', label: 'Greenhouse station', position: [-8, 0, -5], zoneId: 'greenhouse', pinNumber: 1, avatarColor: '#15803d' },
  { id: 'slot-2', label: 'Crop field unit', position: [6, 0, -4], zoneId: 'crop_fields', pinNumber: 2 },
  { id: 'slot-3', label: 'Barn & logistics station', position: [0, 0, 6], zoneId: 'barn_storage', pinNumber: 3, avatarColor: '#b45309' },
]


export const farmPreset: WorldPreset = {
  id: 'preset-farm',
  name: 'Smart Agriculture & Greenhouse Complex',
  type: 'farm',
  description: 'Agricultural farm featuring climate-controlled greenhouses, open crop fields, and automated machinery.',
  dimensions: {
    width: 40,
    height: 8,
    depth: 25,
  },
  camera: {
    position: [28, 25, 28],
    target: [0, 0, 0],
    fov: 42,
  },
  lighting: {
    ambientColor: '#f0fdf4',
    ambientIntensity: 0.9,
    sunColor: '#fef08a',
    sunIntensity: 1.25,
    sunPosition: [25, 35, 20],
    shadows: true,
  },
  theme: {
    name: 'farm-nature',
    floorColor: '#365314',
    woodFloorColor: '#78350f',
    wallColor: '#fef9c3',
    wallFrameColor: '#1c1917',
    glassColor: '#bbf7d0',
    glassOpacity: 0.22,
    accentColor: '#22c55e',
    backgroundColor: '#0c1a0e',
    nightBackgroundColor: '#020d04',
  },
  zones: DEFAULT_FARM_ZONES,
  slots: FARM_SLOTS,

  buildScene: (scene: THREE.Scene, options) => {
    const materials = new MaterialPalette()

    // 1. Soil ground
    const groundGeo = new THREE.PlaneGeometry(40, 25)
    const soilMat = materials.getDarkSlate(options.theme?.floorColor || '#365314')
    const ground = new THREE.Mesh(groundGeo, soilMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // 2. Greenhouse structure
    const ghGroup = new THREE.Group()
    ghGroup.position.set(-10, 0, -5)

    const ghFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 10),
      materials.getTileFloor('#a3e635'),
    )
    ghFloor.rotation.x = -Math.PI / 2
    ghFloor.position.set(0, 0.01, 0)
    ghGroup.add(ghFloor)

    // Glass arches
    const glassMat = materials.getGlassMaterial('#86efac', 0.25)
    const domeGeo = new THREE.CylinderGeometry(5, 5, 12, 16, 1, false, 0, Math.PI)
    const dome = new THREE.Mesh(domeGeo, glassMat)
    dome.rotation.z = Math.PI / 2
    dome.position.set(0, 3, 0)
    ghGroup.add(dome)
    scene.add(ghGroup)

    // 3. Barn / Storage building
    const barnGroup = new THREE.Group()
    barnGroup.position.set(0, 0, 7)
    const barnWalls = new THREE.Mesh(
      new THREE.BoxGeometry(14, 4, 8),
      materials.getWallMaterial('#7f1d1d'),
    )
    barnWalls.position.set(0, 2, 0)
    barnWalls.castShadow = true
    barnGroup.add(barnWalls)

    // Roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(8, 2, 4),
      materials.getFrameMaterial('#1c1917'),
    )
    roof.position.set(0, 5, 0)
    roof.rotation.y = Math.PI / 4
    barnGroup.add(roof)
    scene.add(barnGroup)
  },
}
