import * as THREE from 'three'
import { ProceduralTextureFactory } from './textures'

export class MaterialPalette {
  private materials: Map<string, THREE.Material> = new Map()

  getMaterial<T extends THREE.Material>(key: string, factory: () => T): T {
    if (!this.materials.has(key)) {
      this.materials.set(key, factory())
    }
    return this.materials.get(key) as T
  }

  // Floors
  getTileFloor(color = '#f1f5f9'): THREE.MeshStandardMaterial {
    return this.getMaterial(`floor:tile:${color}`, () => {
      const tex = ProceduralTextureFactory.getTileFloorTexture()
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        map: tex,
        roughness: 0.28,
        metalness: 0.04,
      })
    })
  }

  getWoodParquet(color = '#b68957'): THREE.MeshStandardMaterial {
    return this.getMaterial(`floor:wood:${color}`, () => {
      const tex = ProceduralTextureFactory.getWoodParquetTexture()
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        map: tex,
        roughness: 0.35,
        metalness: 0.06,
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

  // Contact Shadow Material
  getContactShadowMaterial(): THREE.MeshBasicMaterial {
    return this.getMaterial('shadow:contact', () => {
      const shadowTex = ProceduralTextureFactory.getSoftShadowTexture()
      return new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
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
        roughness: 0.25,
        metalness: 0.8,
      })
    })
  }

  getGlassMaterial(color = '#93c5fd', opacity = 0.24): THREE.MeshPhysicalMaterial {
    return this.getMaterial(`glass:${color}:${opacity}`, () => {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity,
        roughness: 0.05,
        metalness: 0.1,
        transmission: 0.9,
        ior: 1.52,
        reflectivity: 0.8,
        depthWrite: false,
      })
    })
  }

  // Furniture & Props
  getDeskTopMaterial(color = '#ffffff'): THREE.MeshStandardMaterial {
    return this.getMaterial(`furniture:desktop:${color}`, () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.35,
        metalness: 0.08,
      })
    })
  }

  getExecutiveWoodMaterial(): THREE.MeshStandardMaterial {
    return this.getMaterial('furniture:executive_wood', () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#382212'),
        roughness: 0.28,
        metalness: 0.15,
      })
    })
  }

  getLeatherMaterial(color = '#1e293b'): THREE.MeshStandardMaterial {
    return this.getMaterial(`furniture:leather:${color}`, () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.55,
        metalness: 0.05,
      })
    })
  }

  getMetalLegMaterial(): THREE.MeshStandardMaterial {
    return this.getMaterial('furniture:metal_legs', () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#1e293b'),
        roughness: 0.2,
        metalness: 0.85,
      })
    })
  }

  getMonitorBezelMaterial(): THREE.MeshStandardMaterial {
    return this.getMaterial('tech:bezel', () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#090d16'),
        roughness: 0.2,
        metalness: 0.8,
      })
    })
  }

  getMonitorScreenMaterial(type: 'code' | 'dashboard' | 'charts' = 'dashboard'): THREE.MeshBasicMaterial {
    return this.getMaterial(`tech:screen:${type}`, () => {
      const tex = ProceduralTextureFactory.getScreenTexture(type)
      return new THREE.MeshBasicMaterial({
        map: tex,
      })
    })
  }

  getPlantLeavesMaterial(): THREE.MeshStandardMaterial {
    return this.getMaterial('nature:ficus_leaves', () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#15803d'),
        roughness: 0.45,
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

  // Realistic Avatars / People
  getSkinMaterial(color = '#fbcfe8'): THREE.MeshStandardMaterial {
    return this.getMaterial(`person:skin:${color}`, () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.5,
        metalness: 0.02,
      })
    })
  }

  getHairMaterial(color = '#1e1b4b'): THREE.MeshStandardMaterial {
    return this.getMaterial(`person:hair:${color}`, () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.65,
        metalness: 0.04,
      })
    })
  }

  getClothingMaterial(color = '#2563eb'): THREE.MeshStandardMaterial {
    return this.getMaterial(`person:clothes:${color}`, () => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.6,
        metalness: 0.06,
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
        opacity: 0.85,
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
