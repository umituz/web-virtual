import { describe, expect, it, vi } from 'vitest'
import { createTickBinder } from './tickBinder'

function fakeEngine() {
  const registered = new Set<(delta: number, elapsed: number) => void>()
  const step = (delta: number, elapsed: number): void => {
    for (const fn of registered) fn(delta, elapsed)
  }
  return {
    register: (fn: (delta: number, elapsed: number) => void) => {
      registered.add(fn)
      return () => registered.delete(fn)
    },
    step,
  }
}

describe('createTickBinder', () => {
  it('queues registrations made before bind and flushes them on bind', () => {
    const binder = createTickBinder()
    const early = vi.fn()
    binder.register(early)

    const engine = fakeEngine()
    binder.bind(engine.register)
    engine.step(0.1, 1)
    expect(early).toHaveBeenCalledWith(0.1, 1)
  })

  it('registers straight through after bind and stops on unregister', () => {
    const binder = createTickBinder()
    const engine = fakeEngine()
    binder.bind(engine.register)

    const late = vi.fn()
    const stop = binder.register(late)
    engine.step(0.2, 2)
    expect(late).toHaveBeenCalledTimes(1)

    stop()
    engine.step(0.3, 3)
    expect(late).toHaveBeenCalledTimes(1)
  })

  it('clear drops the binding; later registrations queue again', () => {
    const binder = createTickBinder()
    const engine = fakeEngine()
    binder.bind(engine.register)
    binder.clear()

    const fn = vi.fn()
    binder.register(fn)
    engine.step(0.4, 4)
    expect(fn).not.toHaveBeenCalled()
  })
})
