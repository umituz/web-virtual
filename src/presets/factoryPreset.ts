import * as THREE from 'three'
import type { WorldPreset, WorldEntity, WorldZone } from '../core/types'
import { MaterialPalette } from '../engine/materials'

export const DEFAULT_FACTORY_ZONES: WorldZone[] = [
  {
    id: 'assembly_line',
    name: 'Robotic Assembly Line',
    color: '#0284c7',
    description: 'High-speed robotic assembly and part joining line.',
    cameraFocus: [-6, 1.2, 0],
  },
  {
    id: 'quality_control',
    name: 'Quality Control & Optical Testing',
    color: '#10b981',
    description: 'Product scanning, defect detection and packaging approval station.',
    cameraFocus: [6, 1.0, -4],
  },
  {
    id: 'warehouse_racks',
    name: 'Logistics & Rack Warehouse',
    color: '#f59e0b',
    description: 'Automated palletizing and vertical storage area.',
    cameraFocus: [6, 2.0, 5],
  },
]

export const DEFAULT_FACTORY_ENTITIES: WorldEntity[] = [
  {
    id: 'factory-op-1',
    type: 'person',
    name: 'Serkan — Line Chief',
    role: 'Production flow supervisor',
    department: 'Manufacturing',
    zoneId: 'assembly_line',
    status: 'working',
    pinNumber: 1,
    position: [-6, 0, 2],
    avatarColor: '#0369a1',
  },
  {
    id: 'robot-arm-1',
    type: 'equipment',
    name: 'Robotic Arm RX-4',
    role: 'Precision welding & assembly',
    department: 'Robotics',
    zoneId: 'assembly_line',
    status: 'running',
    pinNumber: 2,
    position: [-6, 0, -2],
  },
  {
    id: 'factory-inspector',
    type: 'person',
    name: 'Ebru — Quality Engineer',
    role: 'Tolerance verification',
    department: 'Quality',
    zoneId: 'quality_control',
    status: 'idle',
    pinNumber: 3,
    position: [6, 0, -4],
    avatarColor: '#047857',
  },
]

export const factoryPreset: WorldPreset = {
  id: 'preset-factory',
  name: 'Smart Industrial Automation Plant',
  type: 'factory',
  description: 'Industrial manufacturing facility equipped with conveyor belts, assembly robots, and warehouse racks.',
  dimensions: {
    width: 38,
    height: 8,
    depth: 22,
  },
  camera: {
    position: [26, 22, 26],
    target: [0, 0, 0],
    fov: 42,
  },
  lighting: {
    ambientColor: '#f8fafc',
    ambientIntensity: 0.8,
    sunColor: '#e0f2fe',
    sunIntensity: 1.1,
    sunPosition: [20, 28, 15],
    shadows: true,
  },
  theme: {
    name: 'industrial-steel',
    floorColor: '#334155',
    wallColor: '#64748b',
    wallFrameColor: '#0f172a',
    accentColor: '#0284c7',
    backgroundColor: '#090d16',
    nightBackgroundColor: '#020617',
  },
  zones: DEFAULT_FACTORY_ZONES,
  defaultEntities: DEFAULT_FACTORY_ENTITIES,

  buildScene: (scene: THREE.Scene, options) => {
    const materials = new MaterialPalette()

    // 1. Concrete floor
    const floorGeo = new THREE.PlaneGeometry(38, 22)
    const floorMat = materials.getDarkSlate(options.theme?.floorColor || '#334155')
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    // 2. Conveyor Belt
    const conveyorGroup = new THREE.Group()
    conveyorGroup.position.set(-6, 0, 0)

    const beltBed = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.6, 14),
      materials.getFrameMaterial('#1e293b'),
    )
    beltBed.position.set(0, 0.3, 0)
    beltBed.castShadow = true
    conveyorGroup.add(beltBed)

    const beltSurface = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 13.8),
      materials.getTileFloor('#475569'),
    )
    beltSurface.rotation.x = -Math.PI / 2
    beltSurface.position.set(0, 0.61, 0)
    conveyorGroup.add(beltSurface)
    scene.add(conveyorGroup)

    // 3. Storage Racks
    const rackGroup = new THREE.Group()
    rackGroup.position.set(8, 0, 4)

    for (let level = 1; level <= 3; level++) {
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.08, 2.5),
        materials.getFrameMaterial('#eab308'),
      )
      shelf.position.set(0, level * 1.4, 0)
      shelf.castShadow = true
      rackGroup.add(shelf)
    }

    // Rack vertical posts
    const postMat = materials.getMetalLegMaterial()
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.5, 0.1), postMat)
    p1.position.set(-3.9, 2.25, -1.2)
    rackGroup.add(p1)

    const p2 = p1.clone()
    p2.position.set(3.9, 2.25, -1.2)
    rackGroup.add(p2)

    const p3 = p1.clone()
    p3.position.set(-3.9, 2.25, 1.2)
    rackGroup.add(p3)

    const p4 = p1.clone()
    p4.position.set(3.9, 2.25, 1.2)
    rackGroup.add(p4)

    scene.add(rackGroup)
  },
}
