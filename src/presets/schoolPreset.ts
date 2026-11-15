import * as THREE from 'three'
import type { WorldPreset, WorldEntity, WorldZone } from '../core/types'
import { MaterialPalette } from '../engine/materials'

export const DEFAULT_SCHOOL_ZONES: WorldZone[] = [
  {
    id: 'lecture_hall',
    name: 'Ana Amfi & Derslik',
    color: '#6366f1',
    description: 'Etkileşimli akıllı tahta ve öğrenci sıraları alanı.',
    cameraFocus: [-6, 1.2, 0],
  },
  {
    id: 'stem_lab',
    name: 'STEM & Robotik Laboratuvarı',
    color: '#06b6d4',
    description: 'Deney masaları ve prototipleme istasyonu.',
    cameraFocus: [6, 1.0, -3],
  },
  {
    id: 'library',
    name: 'Kütüphane & Çalışma Salonu',
    color: '#8b5cf6',
    description: 'Sessiz araştırma ve kitaplık bölümü.',
    cameraFocus: [6, 1.0, 4],
  },
]

export const DEFAULT_SCHOOL_ENTITIES: WorldEntity[] = [
  {
    id: 'teacher-1',
    type: 'person',
    name: 'Prof. Deniz — Bölüm Başkanı',
    role: 'Ders Anlatımı & Mentorluk',
    department: 'Akademik',
    zoneId: 'lecture_hall',
    status: 'working',
    pinNumber: 1,
    position: [-6, 0, -4],
    avatarColor: '#4338ca',
  },
  {
    id: 'student-1',
    type: 'person',
    name: 'Zeynep — Lisansüstü Araştırmacı',
    role: 'STEM Deney Uygulayıcısı',
    department: 'Araştırma',
    zoneId: 'stem_lab',
    status: 'idle',
    pinNumber: 2,
    position: [6, 0, -3],
    avatarColor: '#0891b2',
  },
]

export const schoolPreset: WorldPreset = {
  id: 'preset-school',
  name: 'Modern University & Academy Campus',
  type: 'school',
  description: 'Educational environment featuring lecture halls, science labs, and collaborative study spaces.',
  dimensions: {
    width: 36,
    height: 6,
    depth: 20,
  },
  camera: {
    position: [25, 23, 25],
    target: [0, 0, 0],
    fov: 40,
  },
  lighting: {
    ambientColor: '#ffffff',
    ambientIntensity: 0.85,
    sunColor: '#fffbeb',
    sunIntensity: 1.15,
    shadows: true,
  },
  theme: {
    name: 'academic-campus',
    floorColor: '#e0e7ff',
    woodFloorColor: '#d97706',
    wallColor: '#f8fafc',
    wallFrameColor: '#1e1b4b',
    glassColor: '#c7d2fe',
    accentColor: '#4f46e5',
    backgroundColor: '#0f172a',
  },
  zones: DEFAULT_SCHOOL_ZONES,
  defaultEntities: DEFAULT_SCHOOL_ENTITIES,

  buildScene: (scene: THREE.Scene, options) => {
    const materials = new MaterialPalette()

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 20),
      materials.getTileFloor(options.theme?.floorColor || '#e0e7ff'),
    )
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    // Teacher podium / Smartboard
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 2.2, 0.08),
      materials.getMonitorScreenMaterial('dashboard'),
    )
    board.position.set(-6, 2.0, -9)
    scene.add(board)
  },
}
