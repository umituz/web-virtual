import * as THREE from 'three'
import type { WorldPreset, WorldEntity, WorldZone } from '../core/types'
import { MaterialPalette } from '../engine/materials'

export const DEFAULT_HOSPITAL_ZONES: WorldZone[] = [
  {
    id: 'triage_er',
    name: 'Emergency Response & Triage',
    color: '#ef4444',
    description: 'First assessment and emergency response unit.',
    cameraFocus: [-8, 1.2, 0],
  },
  {
    id: 'consultation',
    name: 'Outpatient & Specialist Rooms',
    color: '#06b6d4',
    description: 'Patient examination and clinical diagnosis area.',
    cameraFocus: [4, 1.0, -4],
  },
  {
    id: 'icu_ward',
    name: 'Intensive Care & Monitoring Ward',
    color: '#3b82f6',
    description: 'Vital sign monitors and patient beds.',
    cameraFocus: [6, 1.0, 5],
  },
]

export const DEFAULT_HOSPITAL_ENTITIES: WorldEntity[] = [
  {
    id: 'doctor-1',
    type: 'person',
    name: 'Dr. Selin — Chief Physician',
    role: 'Clinical director & medical decisions',
    department: 'Surgery',
    zoneId: 'consultation',
    status: 'working',
    pinNumber: 1,
    position: [4, 0, -4],
    avatarColor: '#0284c7',
  },
  {
    id: 'nurse-1',
    type: 'person',
    name: 'Nurse Burak — Triage Specialist',
    role: 'Patient intake & vitals monitoring',
    department: 'Emergency',
    zoneId: 'triage_er',
    status: 'idle',
    pinNumber: 2,
    position: [-8, 0, 0],
    avatarColor: '#059669',
  },
]

export const hospitalPreset: WorldPreset = {
  id: 'preset-hospital',
  name: 'Smart Healthcare & Hospital Medical Center',
  type: 'hospital',
  description: 'Healthcare facility with triage stations, medical consultation rooms, and intensive care monitoring.',
  dimensions: {
    width: 36,
    height: 6,
    depth: 20,
  },
  camera: {
    position: [26, 24, 26],
    target: [0, 0, 0],
    fov: 40,
  },
  lighting: {
    ambientColor: '#ffffff',
    ambientIntensity: 0.9,
    sunColor: '#f0fdfa',
    sunIntensity: 1.1,
    shadows: true,
  },
  theme: {
    name: 'clinical-hygiene',
    floorColor: '#f0fdfa',
    wallColor: '#f8fafc',
    wallFrameColor: '#0f766e',
    glassColor: '#99f6e4',
    accentColor: '#0d9488',
    backgroundColor: '#042f2e',
  },
  zones: DEFAULT_HOSPITAL_ZONES,
  defaultEntities: DEFAULT_HOSPITAL_ENTITIES,

  buildScene: (scene: THREE.Scene, options) => {
    const materials = new MaterialPalette()

    // Sterile Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 20),
      materials.getTileFloor(options.theme?.floorColor || '#f0fdfa'),
    )
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    // Red Cross / Medical Logo on Wall
    const crossH = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.6, 0.05),
      materials.getWallMaterial('#ef4444'),
    )
    crossH.position.set(0, 2.5, -9.9)
    scene.add(crossH)

    const crossV = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 2.4, 0.05),
      materials.getWallMaterial('#ef4444'),
    )
    crossV.position.set(0, 2.5, -9.9)
    scene.add(crossV)
  },
}
