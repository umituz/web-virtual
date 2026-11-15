import { describe, it, expect } from 'vitest'
import { ASSET_CATALOG } from './assetCatalog'
import { ModelLoader } from './modelLoader'

describe('Asset Catalog & Model Loader', () => {
  it('registers all required office models in ASSET_CATALOG', () => {
    expect(ASSET_CATALOG['furniture:desk']).toBeDefined()
    expect(ASSET_CATALOG['furniture:chairDesk']).toBeDefined()
    expect(ASSET_CATALOG['equipment:screen']).toBeDefined()
    expect(ASSET_CATALOG['equipment:keyboard']).toBeDefined()
    expect(ASSET_CATALOG['decor:pottedPlant']).toBeDefined()
    expect(ASSET_CATALOG['character:male-a']).toBeDefined()
    expect(ASSET_CATALOG['character:female-a']).toBeDefined()
  })

  it('verifies CC0 license attribution for all assets', () => {
    for (const [id, meta] of Object.entries(ASSET_CATALOG)) {
      expect(meta.license, `Asset ${id} must have valid license`).toContain('CC0')
      expect(meta.author, `Asset ${id} must have author`).toBe('Kenney')
      expect(meta.path, `Asset ${id} must point to .glb`).toMatch(/\.glb$/)
    }
  })

  it('initializes ModelLoader singleton', () => {
    const loader1 = ModelLoader.getInstance()
    const loader2 = ModelLoader.getInstance()
    expect(loader1).toBe(loader2)
  })
})
