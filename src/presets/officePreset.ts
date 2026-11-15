import * as THREE from 'three'
import type { WorldPreset, WorldEntity, WorldZone } from '../core/types'
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

export interface DepartmentInfo {
  id: string
  name: string
  slug: string
  description: string
  managerSlotId: string
  managerRole: string
  color: string
  slotIds: string[]
  iconName?: 'briefcase' | 'palette' | 'megaphone' | 'shield' | 'globe'
}

export const DEFAULT_OFFICE_DEPARTMENTS: DepartmentInfo[] = [
  {
    id: 'dept-management',
    name: 'General Management & Strategy',
    slug: 'management',
    description: 'Company vision, department coordination, strategic planning and approval audits.',
    managerSlotId: 'slot-1',
    managerRole: 'Digital Agency Director (General Manager)',
    color: '#3b82f6',
    slotIds: ['slot-1', 'slot-13'],
    iconName: 'briefcase',
  },
  {
    id: 'dept-creative',
    name: 'Content & Creative Design',
    slug: 'creative',
    description: 'Social media content, visual concepts, ad hooks and viral video production.',
    managerSlotId: 'slot-3',
    managerRole: 'Creative Visual Director',
    color: '#a855f7',
    slotIds: ['slot-2', 'slot-3', 'slot-4', 'slot-5'],
    iconName: 'palette',
  },
  {
    id: 'dept-marketing',
    name: 'Marketing & Growth',
    slug: 'marketing',
    description: 'Google & Meta ads, organic SEO, email funnel automation and customer relationships (CRM).',
    managerSlotId: 'slot-6',
    managerRole: 'Performance Marketing & Media Buying',
    color: '#10b981',
    slotIds: ['slot-6', 'slot-7', 'slot-8', 'slot-9', 'slot-14'],
    iconName: 'megaphone',
  },
  {
    id: 'dept-tech',
    name: 'Technology, UI/UX & Data',
    slug: 'tech',
    description: 'Conversion-focused web interfaces, landing page wireframes and campaign growth analytics.',
    managerSlotId: 'slot-11',
    managerRole: 'UI/UX & Web Interface Designer',
    color: '#06b6d4',
    slotIds: ['slot-11', 'slot-12'],
    iconName: 'globe',
  },
  {
    id: 'dept-operations',
    name: 'Operations, Quality & Finance',
    slug: 'operations',
    description: 'Revenue/expense balance, budget control, quality assurance and the corporate knowledge archive.',
    managerSlotId: 'slot-10',
    managerRole: 'Agency Accountant & Finance Specialist',
    color: '#f59e0b',
    slotIds: ['slot-10', 'slot-15', 'slot-16', 'slot-17'],
    iconName: 'shield',
  },
]

// 17 standard desk positions matching the reference architectural layout
export const DEFAULT_OFFICE_ENTITIES: WorldEntity[] = [
  // 1. General Manager / Executive Suite
  {
    id: 'slot-1',
    type: 'person',
    name: 'General Manager (CEO)',
    role: 'Company director & orchestrator',
    department: 'Management',
    zoneId: 'executive',
    status: 'idle',
    pinNumber: 1,
    position: [11, 0, -5.5],
    rotation: [0, 0, 0],
    avatarColor: '#1e293b',
    avatarHair: '#0f172a',
  },
  // Row 1 (Creative & Ads)
  {
    id: 'slot-2',
    type: 'person',
    name: 'Performance Marketing Specialist',
    role: 'Ads & campaign optimization',
    department: 'Marketing',
    zoneId: 'growth',
    status: 'idle',
    pinNumber: 2,
    position: [-13, 0, -6.8],
    rotation: [0, 0, 0],
    avatarColor: '#0284c7',
  },
  {
    id: 'slot-3',
    type: 'person',
    name: 'Creative Director',
    role: 'Visual identity & design',
    department: 'Creative',
    zoneId: 'creative',
    status: 'idle',
    pinNumber: 3,
    position: [-9, 0, -6.8],
    rotation: [0, 0, 0],
    avatarColor: '#db2777',
  },
  {
    id: 'slot-4',
    type: 'person',
    name: 'Ads Manager',
    role: 'Budget & conversion strategy',
    department: 'Marketing',
    zoneId: 'growth',
    status: 'idle',
    pinNumber: 4,
    position: [-5, 0, -6.8],
    rotation: [0, 0, 0],
    avatarColor: '#2563eb',
  },
  {
    id: 'slot-5',
    type: 'person',
    name: 'Email Marketing Specialist',
    role: 'CRM & newsletter flows',
    department: 'Marketing',
    zoneId: 'growth',
    status: 'idle',
    pinNumber: 5,
    position: [-1, 0, -6.8],
    rotation: [0, 0, 0],
    avatarColor: '#7c3aed',
  },

  // Row 2 (Content, Video, Management)
  {
    id: 'slot-6',
    type: 'person',
    name: 'Social Media Manager',
    role: 'Community & content calendar',
    department: 'Creative',
    zoneId: 'creative',
    status: 'idle',
    pinNumber: 6,
    position: [-13, 0, -2.0],
    rotation: [0, 0, 0],
    avatarColor: '#ea580c',
  },
  {
    id: 'slot-7',
    type: 'person',
    name: 'Agency Operations Lead',
    role: 'Process & workflow tracking',
    department: 'Operations',
    zoneId: 'operations',
    status: 'idle',
    pinNumber: 7,
    position: [-9, 0, -2.0],
    rotation: [0, 0, 0],
    avatarColor: '#059669',
  },
  {
    id: 'slot-8',
    type: 'person',
    name: 'Video & Motion Producer',
    role: 'Reels, editing & animation',
    department: 'Creative',
    zoneId: 'creative',
    status: 'idle',
    pinNumber: 8,
    position: [-5, 0, -2.0],
    rotation: [0, 0, 0],
    avatarColor: '#dc2626',
  },
  {
    id: 'slot-9',
    type: 'person',
    name: 'Client Services Director',
    role: 'Team & client coordination',
    department: 'Management',
    zoneId: 'executive',
    status: 'idle',
    pinNumber: 9,
    position: [-1, 0, -2.0],
    rotation: [0, 0, 0],
    avatarColor: '#4f46e5',
  },

  // Row 3 (Copywriter, Research, SEO)
  {
    id: 'slot-10',
    type: 'person',
    name: 'Copywriter',
    role: 'Landing & ad copy',
    department: 'Creative',
    zoneId: 'creative',
    status: 'idle',
    pinNumber: 10,
    position: [-13, 0, 2.8],
    rotation: [0, 0, 0],
    avatarColor: '#0891b2',
  },
  {
    id: 'slot-11',
    type: 'person',
    name: 'Market Researcher',
    role: 'Competitor & trend analysis',
    department: 'Marketing',
    zoneId: 'growth',
    status: 'idle',
    pinNumber: 11,
    position: [-9, 0, 2.8],
    rotation: [0, 0, 0],
    avatarColor: '#16a34a',
  },
  {
    id: 'slot-12',
    type: 'person',
    name: 'Brand Strategist',
    role: 'Positioning & messaging',
    department: 'Management',
    zoneId: 'executive',
    status: 'idle',
    pinNumber: 12,
    position: [-5, 0, 2.8],
    rotation: [0, 0, 0],
    avatarColor: '#9333ea',
  },
  {
    id: 'slot-13',
    type: 'person',
    name: 'SEO & Organic Growth',
    role: 'Search engine & content distribution',
    department: 'Marketing',
    zoneId: 'growth',
    status: 'idle',
    pinNumber: 13,
    position: [-1, 0, 2.8],
    rotation: [0, 0, 0],
    avatarColor: '#0284c7',
  },

  // Front Hub (Art Direction & Design)
  {
    id: 'slot-14',
    type: 'person',
    name: 'Visual Designer (UI/UX)',
    role: 'Interface & web design',
    department: 'Technology',
    zoneId: 'tech',
    status: 'idle',
    pinNumber: 14,
    position: [-10, 0, 7.5],
    rotation: [0, 0, 0],
    avatarColor: '#e11d48',
  },
  {
    id: 'slot-15',
    type: 'person',
    name: 'Art Director (AI imagery)',
    role: 'AI visual artist',
    department: 'Creative',
    zoneId: 'creative',
    status: 'idle',
    pinNumber: 15,
    position: [-4, 0, 7.5],
    rotation: [0, 0, 0],
    avatarColor: '#475569',
  },

  // Meeting Room Desks / Client Relations
  {
    id: 'slot-16',
    type: 'person',
    name: 'Knowledge Librarian & QA',
    role: 'Process validation & documentation',
    department: 'Operations',
    zoneId: 'operations',
    status: 'idle',
    pinNumber: 16,
    position: [7.5, 0, 7.5],
    rotation: [0, -Math.PI / 4, 0],
    avatarColor: '#ca8a04',
  },
  {
    id: 'slot-17',
    type: 'person',
    name: 'Client Relations Lead',
    role: 'Onboarding & communication',
    department: 'Operations',
    zoneId: 'meeting',
    status: 'idle',
    pinNumber: 17,
    position: [13.5, 0, 7.5],
    rotation: [0, Math.PI / 4, 0],
    avatarColor: '#059669',
  },
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
  defaultEntities: DEFAULT_OFFICE_ENTITIES,

  buildScene: (scene: THREE.Scene, options) => {
    const materials = new MaterialPalette()

    // 1. Build Base Architecture (Floors, Glass perimeter, partitions, whiteboard)
    const arch = buildOfficeArchitecture(materials, {
      width: 36,
      depth: 20,
      theme: options.theme,
    })
    scene.add(arch)

    // 2. Executive Suite Desk (Slot 1)
    const execDesk = createExecutiveDesk(materials, { entityId: 'slot-1' })
    execDesk.position.set(11, 0, -5.5)
    scene.add(execDesk)

    // 3. Conference Table in Meeting Room (Center of east parquet wing)
    const confTable = createConferenceTable(materials)
    confTable.position.set(11, 0, 2.5)
    scene.add(confTable)

    // 4. Meeting Room Desks (Slots 16 & 17)
    const desk16 = createModernWorkstation(materials, { entityId: 'slot-16', dualMonitor: false })
    desk16.position.set(7.5, 0, 7.5)
    desk16.rotation.y = -Math.PI / 4
    scene.add(desk16)

    const desk17 = createModernWorkstation(materials, { entityId: 'slot-17', dualMonitor: true })
    desk17.position.set(13.5, 0, 7.5)
    desk17.rotation.y = Math.PI / 4
    scene.add(desk17)

    // 5. Open Office Desks (Slots 2-15)
    const workstationSlots: Array<{ id: string; pos: [number, number, number]; dual: boolean }> = [
      { id: 'slot-2', pos: [-13, 0, -6.8], dual: false },
      { id: 'slot-3', pos: [-9, 0, -6.8], dual: true },
      { id: 'slot-4', pos: [-5, 0, -6.8], dual: false },
      { id: 'slot-5', pos: [-1, 0, -6.8], dual: true },
      { id: 'slot-6', pos: [-13, 0, -2.0], dual: false },
      { id: 'slot-7', pos: [-9, 0, -2.0], dual: true },
      { id: 'slot-8', pos: [-5, 0, -2.0], dual: true },
      { id: 'slot-9', pos: [-1, 0, -2.0], dual: false },
      { id: 'slot-10', pos: [-13, 0, 2.8], dual: false },
      { id: 'slot-11', pos: [-9, 0, 2.8], dual: false },
      { id: 'slot-12', pos: [-5, 0, 2.8], dual: true },
      { id: 'slot-13', pos: [-1, 0, 2.8], dual: true },
      { id: 'slot-14', pos: [-10, 0, 7.5], dual: true },
      { id: 'slot-15', pos: [-4, 0, 7.5], dual: true },
    ]

    for (const ws of workstationSlots) {
      const desk = createModernWorkstation(materials, {
        entityId: ws.id,
        dualMonitor: ws.dual,
        hasLaptop: true,
      })
      desk.position.set(ws.pos[0], ws.pos[1], ws.pos[2])
      scene.add(desk)
    }

    // 6. Architectural Ficus Indoor Plants
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

    // 7. Executive Bookcases & Lounge Breakout Real 3D Models
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
