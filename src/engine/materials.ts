import * as THREE from 'three'
import type { WorldTheme } from '../core/types'

export class MaterialPalette {
  private materials: Map<string, THREE.Material> = new Map()

  getMaterial<T extends THREE.Material>(key: string, factory: () => T): T {
    if (!this.materials.has(key)) {
      this.materials.set(key, factory())
    }
    return this.materials.get(key) as T
  }

  // Floors
  getTileFloor(color = '#e2e8f0'): THREE.MeshStandardMaterial {
    return this.getMaterial(`floor:tile:${color}`, () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.35,
        metalness: 0.05,
      })
    })
  }

  getWoodParquet(color = '#b48a58'): THREE.MeshStandardMaterial {
    return this.getMaterial(`floor:wood:${color}`, () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.45,
        metalness: 0.1,
      })
    })
  }

  getDarkSlate(color = '#1e293b'): THREE.MeshStandardMaterial {
    return this.getMaterial(`floor:slate:${color}`, () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.5,
        metalness: 0.15,
      })
    })
  }

  // Walls & Partitions
  getWallMaterial(color = '#f8fafc'): THREE.MeshStandardMaterial {
    return this.getMaterial(`wall:${color}`, () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.85,
        metalness: 0.02,
      })
    })
  }

  getFrameMaterial(color = '#0f172a'): THREE.MeshStandardMaterial {
    return this.getMaterial(`frame:${color}`, () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.3,
        metalness: 0.7,
      })
    })
  }

  getGlassMaterial(color = '#93c5fd', opacity = 0.28): THREE.MeshPhysicalMaterial {
    return this.getMaterial(`glass:${color}:${opacity}`, () => {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity,
        roughness: 0.08,
        metalness: 0.1,
        transmission: 0.85,
        ior: 1.5,
        reflectivity: 0.7,
        depthWrite: false,
      })
    })
  }

  // Furniture & Props
  getDeskTopMaterial(color = '#ffffff'): THREE.MeshStandardMaterial {
    return this.getMaterial(`furniture:desktop:${color}`, () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.4,
        metalness: 0.1,
      })
    })
  }

  getExecutiveWoodMaterial(): THREE.MeshStandardMaterial {
    return this.getMaterial('furniture:executive_wood', () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#382212'),
        roughness: 0.3,
        metalness: 0.15,
      })
    })
  }

  getLeatherMaterial(color = '#1e293b'): THREE.MeshStandardMaterial {
    return this.getMaterial(`furniture:leather:${color}`, () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.6,
        metalness: 0.05,
      })
    })
  }

  getMetalLegMaterial(): THREE.MeshStandardMaterial {
    return this.getMaterial('furniture:metal_legs', () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#334155'),
        roughness: 0.2,
        metalness: 0.85,
      })
    })
  }

  getMonitorBezelMaterial(): THREE.MeshStandardMaterial {
    return this.getMaterial('tech:bezel', () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#090d16'),
        roughness: 0.25,
        metalness: 0.75,
      })
    })
  }

  getMonitorScreenMaterial(active = true, color = '#38bdf8'): THREE.MeshBasicMaterial {
    return this.getMaterial(`tech:screen:${active}:${color}`, () => {
      return new THREE.MeshBasicMaterial({
        color: new THREE.Color(active ? color : '#0f172a'),
      })
    })
  }

  getPlantLeavesMaterial(): THREE.MeshStandardMaterial {
    return this.getMaterial('nature:ficus_leaves', () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#15803d'),
        roughness: 0.5,
        metalness: 0.05,
      })
    })
  }

  getTerracottaPotMaterial(): THREE.MeshStandardMaterial {
    return this.getMaterial('nature:pot_terracotta', () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#c2410c'),
        roughness: 0.8,
        metalness: 0.02,
      })
    })
  }

  // Avatars / People
  getSkinMaterial(color = '#fbcfe8'): THREE.MeshStandardMaterial {
    return this.getMaterial(`person:skin:${color}`, () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.6,
        metalness: 0.05,
      })
    })
  }

  getHairMaterial(color = '#1e1b4b'): THREE.MeshStandardMaterial {
    return this.getMaterial(`person:hair:${color}`, () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.7,
        metalness: 0.05,
      })
    })
  }

  getClothingMaterial(color = '#2563eb'): THREE.MeshStandardMaterial {
    return this.getMaterial(`person:clothes:${color}`, () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.65,
        metalness: 0.08,
      })
    })
  }

  // Status Glow Ring
  getStatusGlow(status: string): THREE.MeshBasicMaterial {
    let color = '#22c55e'
    if (status === 'running' || status === 'working') color = '#3b82f6'
    else if (status === 'awaiting_approval') color = '#f59e0b'
    else if (status === 'failed') color = '#ef4444'
    else if (status === 'offline') color = '#64748b'

    return this.getMaterial(`status:glow:${color}`, () => {
      return new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.8,
      })
    })
  }

  dispose(): void {
    for (const mat of this.materials.values()) {
      mat.dispose()
    }
    this.materials.clear()
  }
}
