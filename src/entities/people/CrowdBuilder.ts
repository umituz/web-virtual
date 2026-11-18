import * as THREE from 'three'
import { ModelLoader } from '../../engine/modelLoader'

export interface CrowdOptions {
  count: number
  radius?: number
  centerX?: number
  centerZ?: number
  baseY?: number
  spreadFactor?: number
  animations?: string[]
  /** Per-frame callback hook (passes delta seconds and elapsed seconds) */
  registerTick?: (fn: (delta: number, elapsed: number) => void) => void
}

/**
 * Creates a dynamic, animated crowd of 3D characters distributed on a floor or plaza.
 * Utilizes standard Three.js AnimationMixer with embedded GLB animations (walk, idle, dance/crouch, sprint).
 * Consumer applications simply specify count and position; zero manual Three.js mixer boilerplate required.
 */
export function createCrowd(options: CrowdOptions): THREE.Group {
  const group = new THREE.Group()
  group.name = 'virtual-crowd'

  const {
    count,
    radius = 1.55,
    centerX = 0,
    centerZ = 1.3,
    baseY = 0.16,
    spreadFactor = 1.5,
    animations = ['walk', 'idle', 'sprint', 'crouch'],
    registerTick,
  } = options

  const GOLDEN = Math.PI * (3 - Math.sqrt(5))
  const loader = ModelLoader.getInstance()
  const charModels = [
    'character:female-a',
    'character:female-b',
    'character:male-a',
    'character:male-b',
  ]

  const mixers: THREE.AnimationMixer[] = []

  for (let i = 0; i < count; i++) {
    const r = 0.95 + radius * Math.sqrt((i + 0.6) / Math.max(1, count))
    const a = i * GOLDEN
    const x = centerX + Math.cos(a) * r * spreadFactor
    const z = centerZ + Math.sin(a) * r
    const modelId = charModels[i % charModels.length] || 'character:female-a'

    void loader.load(modelId).then((charModel) => {
      if (!charModel) return

      charModel.position.set(x, baseY, z)
      charModel.rotation.y = Math.atan2(centerX - x, centerZ - z) + ((i % 3) - 1) * 0.5
      charModel.scale.setScalar(1.4)
      charModel.traverse((child) => {
        child.castShadow = false
        if (child instanceof THREE.Mesh) {
          child.userData.entityId = 'dancefloor'
        }
      })
      group.add(charModel)

      const anims = charModel.animations || []
      if (anims.length > 0) {
        const mixer = new THREE.AnimationMixer(charModel)
        mixers.push(mixer)

        const clipName = animations[i % animations.length] || 'walk'
        const clip = THREE.AnimationClip.findByName(anims, clipName) || anims[0]
        if (clip) {
          const action = mixer.clipAction(clip)
          action.time = (i * 0.3) % clip.duration
          action.timeScale = 0.88 + ((i % 5) * 0.06)
          action.play()
        }
      }
    })
  }

  // If a registerTick hook is provided, step all crowd mixers inside the frame loop
  if (registerTick) {
    let lastElapsed = 0
    registerTick((delta, elapsed) => {
      const dt = delta > 0 ? delta : (lastElapsed > 0 ? Math.min(0.05, elapsed - lastElapsed) : 0.016)
      lastElapsed = elapsed
      for (const mixer of mixers) {
        mixer.update(dt)
      }
    })
  }

  return group
}
