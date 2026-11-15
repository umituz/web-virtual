import * as THREE from 'three'
import type { WorldPreset, WorldEntity, WorldZone } from '../core/types'
import { MaterialPalette } from '../engine/materials'
import { buildOfficeArchitecture } from '../entities/architecture/OfficeArchitectureBuilder'
import { createModernWorkstation, createExecutiveDesk, createConferenceTable } from '../entities/furniture/DeskBuilder'
import { createFicusPlant } from '../entities/props/PlantBuilder'
import { createStylizedAvatar } from '../entities/people/AvatarBuilder'

export const DEFAULT_OFFICE_ZONES: WorldZone[] = [
  {
    id: 'executive',
    name: 'Yönetim & Strateji Ofisi',
    color: '#8b5cf6',
    description: 'Şirket liderliği, genel müdür ve stratejik danışmanlık çalışma alanı.',
    cameraFocus: [11, 1.2, -5.5],
  },
  {
    id: 'meeting',
    name: 'Konferans & Müşteri Salonu',
    color: '#06b6d4',
    description: 'Müşteri görüşmeleri, büyük strateji toplantıları ve lansman odası.',
    cameraFocus: [11, 1.2, 4.5],
  },
  {
    id: 'creative',
    name: 'Kreatif & İçerik Stüdyosu',
    color: '#ec4899',
    description: 'Görsel tasarım, video prodüksiyon ve yaratıcı metin geliştirme alanı.',
    cameraFocus: [-6, 1.0, -6.5],
  },
  {
    id: 'tech',
    name: 'Yazılım & Teknoloji Merkezi',
    color: '#3b82f6',
    description: 'Sistem geliştirme, veri analitiği ve platform mühendisliği istasyonu.',
    cameraFocus: [-6, 1.0, -1.8],
  },
  {
    id: 'growth',
    name: 'Büyüme & Dijital Pazarlama',
    color: '#10b981',
    description: 'Performans reklamları, SEO, e-posta otomasyonu ve büyüme operasyonları.',
    cameraFocus: [-6, 1.0, 3.2],
  },
  {
    id: 'operations',
    name: 'Operasyon & Finans Masası',
    color: '#f59e0b',
    description: 'Bütçe, fatura, kurumsal arşiv ve operasyonel kalite kontrol merkezi.',
    cameraFocus: [-6, 1.0, 7.8],
  },
]

// 17 standard desk positions matching the reference architectural layout
export const DEFAULT_OFFICE_ENTITIES: WorldEntity[] = [
  // 1. Genel Müdür / Executive Suite
  {
    id: 'slot-1',
    type: 'person',
    name: 'Genel Müdür (CEO)',
    role: 'Şirket Direktörü & Orkestratör',
    department: 'Yönetim',
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
    name: 'Performans Pazarlama Uzmanı',
    role: 'Ads & Kampanya Optimizasyonu',
    department: 'Pazarlama',
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
    name: 'Kreatif Direktör',
    role: 'Görsel Kimlik & Tasarım',
    department: 'Kreatif',
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
    name: 'Reklam Yöneticisi',
    role: 'Bütçe & Dönüşüm Stratejisi',
    department: 'Pazarlama',
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
    name: 'E-Posta Pazarlama Uzmanı',
    role: 'CRM & Bülten Akışları',
    department: 'Pazarlama',
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
    name: 'Sosyal Medya Yöneticisi',
    role: 'Topluluk & Gönderi Takvimi',
    department: 'Kreatif',
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
    name: 'Ajans Operasyon Lideri',
    role: 'Süreç & İş Akışı Takibi',
    department: 'Operasyon',
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
    role: 'Reels, Kurgu & Animasyon',
    department: 'Kreatif',
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
    name: 'Dijital Ajans Yöneticisi',
    role: 'Ekip Koordinasyonu',
    department: 'Yönetim',
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
    name: 'Metin Yazarı & Copywriter',
    role: 'Landing & Reklam Metinleri',
    department: 'Kreatif',
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
    name: 'Pazar Araştırmacısı',
    role: 'Rakip & Trend Analizi',
    department: 'Pazarlama',
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
    name: 'Marka Stratejisti',
    role: 'Konumlandırma & Mesajlaşma',
    department: 'Yönetim',
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
    name: 'SEO & Organik Büyüme',
    role: 'Arama Motoru & İçerik Dağıtımı',
    department: 'Pazarlama',
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
    name: 'Görsel Tasarımcı (UI/UX)',
    role: 'Arayüz & Web Tasarımı',
    department: 'Teknoloji',
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
    name: 'Görsel Yönetmen (Midjourney)',
    role: 'Yapay Zeka Sanatçısı',
    department: 'Kreatif',
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
    name: 'Bilgi Kütüphanecisi & QA',
    role: 'Süreç Doğrulama & Dokümantasyon',
    department: 'Operasyon',
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
    name: 'Müşteri İlişkileri Lideri',
    role: 'Onboarding & İletişim',
    department: 'Operasyon',
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
    ambientIntensity: 0.85,
    sunColor: '#fff5ea',
    sunIntensity: 1.1,
    sunPosition: [20, 30, 15],
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
    backgroundColor: '#0f172a',
    nightBackgroundColor: '#020617',
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
  },
}
