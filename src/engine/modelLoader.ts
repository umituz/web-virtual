import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { ASSET_CATALOG, type AssetMetadata } from './assetCatalog'

export class ModelLoader {
  private static instance: ModelLoader | null = null
  private loader: GLTFLoader
  private cache: Map<string, THREE.Group> = new Map()
  private pending: Map<string, Promise<THREE.Group>> = new Map()
  private basePath = ''

  constructor() {
    this.loader = new GLTFLoader()
  }

  static getInstance(): ModelLoader {
    if (!ModelLoader.instance) {
      ModelLoader.instance = new ModelLoader()
    }
    return ModelLoader.instance
  }

  setBasePath(path: string): void {
    this.basePath = path.replace(/\/$/, '')
  }

  async load(assetIdOrPath: string): Promise<THREE.Group> {
    const meta: AssetMetadata | undefined = ASSET_CATALOG[assetIdOrPath]
    const rawPath = meta ? meta.path : assetIdOrPath
    const resolvedPath = this.basePath ? `${this.basePath}${rawPath}` : rawPath

    // 1. Return from cache if already loaded
    if (this.cache.has(resolvedPath)) {
      return this.cloneGroup(this.cache.get(resolvedPath)!, meta)
    }

    // 2. Await in-flight loading promise
    if (this.pending.has(resolvedPath)) {
      const group = await this.pending.get(resolvedPath)!
      return this.cloneGroup(group, meta)
    }

    // 3. Initiate fetch and GLTF parse
    const loadPromise = new Promise<THREE.Group>((resolve) => {
      this.loader.load(
        resolvedPath,
        (gltf) => {
          const root = gltf.scene

          // Configure shadows and PBR properties across all child meshes
          root.traverse((node) => {
            if (node instanceof THREE.Mesh) {
              node.castShadow = true
              node.receiveShadow = true
              if (node.material) {
                if (Array.isArray(node.material)) {
                  node.material.forEach((m) => {
                    m.roughness = 0.4
                    m.metalness = 0.1
                  })
                } else {
                  node.material.roughness = 0.4
                  node.material.metalness = 0.1
                }
              }
            }
          })

          this.cache.set(resolvedPath, root)
          this.pending.delete(resolvedPath)
          resolve(root)
        },
        undefined,
        (err) => {
          console.warn(`[ModelLoader] Failed to load 3D asset at "${resolvedPath}":`, err)
          // Fallback proxy mesh to prevent application crashes
          const fallback = new THREE.Group()
          const box = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.7, 0.8),
            new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 }),
          )
          box.position.set(0, 0.35, 0)
          fallback.add(box)
          resolve(fallback)
        },
      )
    })

    this.pending.set(resolvedPath, loadPromise)
    const loaded = await loadPromise
    return this.cloneGroup(loaded, meta)
  }

  async preload(assetIds: string[]): Promise<void> {
    await Promise.all(assetIds.map((id) => this.load(id)))
  }

  private cloneGroup(source: THREE.Group, meta?: AssetMetadata): THREE.Group {
    const cloned = source.clone(true)
    if (meta && meta.defaultScale) {
      if (typeof meta.defaultScale === 'number') {
        cloned.scale.setScalar(meta.defaultScale)
      } else {
        cloned.scale.set(meta.defaultScale[0], meta.defaultScale[1], meta.defaultScale[2])
      }
    }
    return cloned
  }

  clearCache(): void {
    this.cache.forEach((group) => {
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else if (obj.material) {
            obj.material.dispose()
          }
        }
      })
    })
    this.cache.clear()
    this.pending.clear()
  }
}
