/**
 * Tick binder — a module-scoped bridge between consumer animation code and
 * the engine's tick loop. Registrations made before the engine binds (or
 * between epoch rebuilds) queue up and flush on the next bind, so callers
 * never need to know whether the world is mounted yet.
 *
 * Consumer pattern:
 *   const ticks = createTickBinder()
 *   // in the preset's buildScene:
 *   buildScene: (scene, options) => { if (options.registerTick) ticks.bind(options.registerTick) }
 *   // anywhere in feature code:
 *   const stop = ticks.register((delta, elapsed) => { ... })
 */

import type { WorldTickFn, UnregisterTick } from '../core/types'

export interface TickBinder {
  /** Hand the engine's registerTick hook to the binder (from buildScene options). */
  bind(register: (fn: WorldTickFn) => UnregisterTick): void
  /** Register a per-frame step; runs immediately when bound, queues otherwise. */
  register(fn: WorldTickFn): () => void
  /** Drop the binding and any queued steps (the engine clears its own ticks on dispose). */
  clear(): void
}

export function createTickBinder(): TickBinder {
  let engineRegister: ((fn: WorldTickFn) => UnregisterTick) | null = null
  const pending = new Set<WorldTickFn>()

  return {
    bind(register) {
      engineRegister = register
      for (const fn of pending) register(fn)
      pending.clear()
    },
    register(fn) {
      if (engineRegister) {
        return engineRegister(fn)
      }
      pending.add(fn)
      return () => {
        pending.delete(fn)
      }
    },
    clear() {
      engineRegister = null
      pending.clear()
    },
  }
}
