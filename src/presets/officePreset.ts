import * as THREE from 'three'
import type { WorldPreset, WorldSlot, WorldZone } from '../core/types'
import { MaterialPalette } from '../engine/materials'
import { buildOfficeArchitecture } from '../entities/architecture/OfficeArchitectureBuilder'
import { createModernWorkstation, createExecutiveDesk, createConferenceTable } from '../entities/furniture/DeskBuilder'
import { createFicusPlant } from '../entities/props/PlantBuilder'
import { ModelLoader } from '../engine/modelLoader'

export const DEFAULT_OFFICE_ZONES: WorldZone[] = [
  {
    id: 'executive',
    name: 'Executive & Strategy Office',
    color: '#8b5cf6',
    description: 'Company leadership, general manager and strategic advisory workspace.',
    cameraFocus: [11, 1.2, -5.5],
  },
  {
    id: 'meeting',
    name: 'Conference & Client Room',
    color: '#06b6d4',
    description: 'Client meetings, executive strategy sessions and the launch room.',
    cameraFocus: [11, 1.2, 4.5],
  },
  {
    id: 'creative',
    name: 'Creative & Content Studio',
    color: '#ec4899',
    description: 'Visual design, video production and creative copywriting workspace.',
    cameraFocus: [-6, 1.0, -6.5],
  },
  {
    id: 'tech',
    name: 'Software & Technology Center',
    color: '#3b82f6',
    description: 'System development, data analytics and platform engineering station.',
    cameraFocus: [-6, 1.0, -1.8],
  },
  {
    id: 'growth',
    name: 'Growth & Digital Marketing',
    color: '#10b981',
    description: 'Performance ads, SEO, email automation and growth operations.',
    cameraFocus: [-6, 1.0, 3.2],
  },
  {
    id: 'operations',
    name: 'Operations & Finance Desk',
    color: '#f59e0b',
    description: 'Budget, invoicing, corporate archive and operational quality control.',
    cameraFocus: [-6, 1.0, 7.8],
  },
]

type OfficeDeskKind = 'executive' | 'workstation' | 'meeting'

/**
 * The 17 architectural anchor points of the office floorplan — the single
 * source of truth for BOTH `buildScene` furniture placement and consumer
 * entity auto-placement. Slots describe WHERE someone can sit, never WHO.
 */
export const OFFICE_SLOTS: WorldSlot[] = [
  {
    id: 'slot-1',
    label: 'Executive desk',
    position: [11, 0, -5.5],
    zoneId: 'executive',
    pinNumber: 1,
    avatarColor: '#1e293b',
    metadata: { desk: 'executive' as OfficeDeskKind },
  },
  { id: 'slot-2', label: 'Workstation 2', position: [-13, 0, -6.8], zoneId: 'growth', pinNumber: 2, avatarColor: '#0284c7', metadata: { desk: 'workstation' as OfficeDeskKind, dualMonitor: false } },
  { id: 'slot-3', label: 'Workstation 3', position: [-9, 0, -6.8], zoneId: 'creative', pinNumber: 3, avatarColor: '#db2777', metadata: { desk: 'workstation' as OfficeDeskKind, dualMonitor: true } },
  { id: 'slot-4', label: 'Workstation 4', position: [-5, 0, -6.8], zoneId: 'growth', pinNumber: 4, avatarColor: '#2563eb', metadata: { desk: 'workstation' as OfficeDeskKind, dualMonitor: false } },
  { id: 'slot-5', label: 'Workstation 5', position: [-1, 0, -6.8], zoneId: 'growth', pinNumber: 5, avatarColor: '#7c3aed', metadata: { desk: 'workstation' as OfficeDeskKind, dualMonitor: true } },
  { id: 'slot-6', label: 'Workstation 6', position: [-13, 0, -2.0], zoneId: 'creative', pinNumber: 6, avatarColor: '#ea580c', metadata: { desk: 'workstation' as OfficeDeskKind, dualMonitor: false } },
  { id: 'slot-7', label: 'Workstation 7', position: [-9, 0, -2.0], zoneId: 'operations', pinNumber: 7, avatarColor: '#059669', metadata: { desk: 'workstation' as OfficeDeskKind, dualMonitor: true } },
  { id: 'slot-8', label: 'Workstation 8', position: [-5, 0, -2.0], zoneId: 'creative', pinNumber: 8, avatarColor: '#dc2626', metadata: { desk: 'workstation' as OfficeDeskKind, dualMonitor: true } },
  { id: 'slot-9', label: 'Workstation 9', position: [-1, 0, -2.0], zoneId: 'executive', pinNumber: 9, avatarColor: '#4f46e5', metadata: { desk: 'workstation' as OfficeDeskKind, dualMonitor: false } },
  { id: 'slot-10', label: 'Workstation 10', position: [-13, 0, 2.8], zoneId: 'creative', pinNumber: 10, avatarColor: '#0891b2', metadata: { desk: 'workstation' as OfficeDeskKind, dualMonitor: false } },
  { id: 'slot-11', label: 'Workstation 11', position: [-9, 0, 2.8], zoneId: 'growth', pinNumber: 11, avatarColor: '#16a34a', metadata: { desk: 'workstation' as OfficeDeskKind, dualMonitor: false } },
  { id: 'slot-12', label: 'Workstation 12', position: [-5, 0, 2.8], zoneId: 'executive', pinNumber: 12, avatarColor: '#9333ea', metadata: { desk: 'workstation' as OfficeDeskKind, dualMonitor: true } },
  { id: 'slot-13', label: 'Workstation 13', position: [-1, 0, 2.8], zoneId: 'growth', pinNumber: 13, avatarColor: '#0284c7', metadata: { desk: 'workstation' as OfficeDeskKind, dualMonitor: true } },
  { id: 'slot-14', label: 'Workstation 14', position: [-10, 0, 7.5], zoneId: 'tech', pinNumber: 14, avatarColor: '#e11d48', metadata: { desk: 'workstation' as OfficeDeskKind, dualMonitor: true } },
  { id: 'slot-15', label: 'Workstation 15', position: [-4, 0, 7.5], zoneId: 'creative', pinNumber: 15, avatarColor: '#475569', metadata: { desk: 'workstation' as OfficeDeskKind, dualMonitor: true } },
  { id: 'slot-16', label: 'Meeting room desk A', position: [7.5, 0, 7.5], rotation: [0, -Math.PI / 4, 0], zoneId: 'operations', pinNumber: 16, avatarColor: '#ca8a04', metadata: { desk: 'meeting' as OfficeDeskKind, dualMonitor: false } },
  { id: 'slot-17', label: 'Meeting room desk B', position: [13.5, 0, 7.5], rotation: [0, Math.PI / 4, 0], zoneId: 'meeting', pinNumber: 17, avatarColor: '#059669', metadata: { desk: 'meeting' as OfficeDeskKind, dualMonitor: true } },
]

export const officePreset: WorldPreset = {
  id: 'preset-office-hq',
  name: 'Modern Corporate Agency Headquarters',
  type: 'office',
  description: '17-desk architectural floorplan with executive suite, meeting conference room, and open workstations.',
  dimensions: {
    width: 36,
    height: 6,
    depth: 20,
  },
  camera: {
    position: [26, 24, 26],
    target: [0, 0, 0],
    fov: 40,
    near: 0.1,
    far: 250,
    enableDamping: true,
    dampingFactor: 0.05,
    minDistance: 8,
    maxDistance: 65,
    maxPolarAngle: Math.PI / 2 - 0.05,
  },
  lighting: {
    ambientColor: '#ffffff',
    ambientIntensity: 0.95,
    sunColor: '#fff8f0',
    sunIntensity: 1.2,
    sunPosition: [22, 32, 16],
    nightAmbientColor: '#1e293b',
    nightAmbientIntensity: 0.35,
    nightSunColor: '#60a5fa',
    nightSunIntensity: 0.4,
    shadows: true,
  },
  theme: {
    name: 'corporate-glass',
    floorColor: '#e2e8f0',
    woodFloorColor: '#b48a58',
    wallColor: '#cbd5e1',
    wallFrameColor: '#0f172a',
    glassColor: '#93c5fd',
    glassOpacity: 0.28,
    accentColor: '#3b82f6',
    backgroundColor: '#f8fafc',
    nightBackgroundColor: '#0f172a',
  },
  zones: DEFAULT_OFFICE_ZONES,
  slots: OFFICE_SLOTS,

  buildScene: (scene: THREE.Scene, options) => {
    const materials = new MaterialPalette()

    // 1. Build Base Architecture (Floors, Glass perimeter, partitions, whiteboard)
    const arch = buildOfficeArchitecture(materials, {
      width: 36,
      depth: 20,
      theme: options.theme,
    })
    scene.add(arch)

    // 2. Desk furniture is generated from the architectural slot anchors —
    //    the same data consumer entities are auto-placed onto.
    for (const slot of OFFICE_SLOTS) {
      const kind = (slot.metadata?.desk as OfficeDeskKind) || 'workstation'
      const dual = slot.metadata?.dualMonitor !== false

      if (kind === 'executive') {
        const desk = createExecutiveDesk(materials, { entityId: slot.id })
        desk.position.set(slot.position[0], slot.position[1], slot.position[2])
        if (slot.rotation) desk.rotation.set(slot.rotation[0], slot.rotation[1], slot.rotation[2])
        scene.add(desk)
        continue
      }

      const desk = createModernWorkstation(materials, {
        entityId: slot.id,
        dualMonitor: dual,
        hasLaptop: true,
      })
      desk.position.set(slot.position[0], slot.position[1], slot.position[2])
      if (slot.rotation) desk.rotation.set(slot.rotation[0], slot.rotation[1], slot.rotation[2])
      scene.add(desk)
    }

    // 3. Conference Table in Meeting Room (Center of east parquet wing)
    const confTable = createConferenceTable(materials)
    confTable.position.set(11, 0, 2.5)
    scene.add(confTable)

    // 4. Architectural Ficus Indoor Plants
    const plantCoords: [number, number][] = [
      [-17, -9],
      [-17, 9],
      [2, -9],
      [2, 9],
      [17, -9],
      [17, 9],
    ]

    for (const coord of plantCoords) {
      const plant = createFicusPlant(materials)
      plant.position.set(coord[0], 0, coord[1])
      scene.add(plant)
    }

    // 5. Executive Bookcases & Lounge Breakout Real 3D Models
    const loader = ModelLoader.getInstance()
    void loader.load('furniture:bookcaseOpen').then((bookcase) => {
      if (bookcase) {
        bookcase.scale.set(1.8, 1.8, 1.8)
        bookcase.position.set(14.5, 0, -9.2)
        scene.add(bookcase)
      }
    })

    void loader.load('furniture:loungeSofa').then((sofa) => {
      if (sofa) {
        sofa.scale.set(1.5, 1.5, 1.5)
        sofa.position.set(6.5, 0, -2.5)
        sofa.rotation.y = Math.PI / 2
        scene.add(sofa)
      }
    })

    void loader.load('furniture:tableCoffee').then((coffeeTable) => {
      if (coffeeTable) {
        coffeeTable.scale.set(1.4, 1.4, 1.4)
        coffeeTable.position.set(5.2, 0, -2.5)
        scene.add(coffeeTable)
      }
    })

    void loader.load('furniture:loungeChair').then((armchair) => {
      if (armchair) {
        armchair.scale.set(1.4, 1.4, 1.4)
        armchair.position.set(5.2, 0, -1.2)
        armchair.rotation.y = Math.PI
        scene.add(armchair)
      }
    })
  },
}
