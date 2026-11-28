import { describe, it, expect } from 'vitest'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createCameraTour } from './tour'

function makeControls(): OrbitControls {
  return { autoRotate: false, autoRotateSpeed: 0 } as unknown as OrbitControls
}

describe('createCameraTour', () => {
  it('start enables autoRotate with the default speed', () => {
    const controls = makeControls()
    const tour = createCameraTour({ controls })
    expect(tour.isRunning()).toBe(false)
    tour.start()
    expect(controls.autoRotate).toBe(true)
    expect(controls.autoRotateSpeed).toBe(0.8)
    expect(tour.isRunning()).toBe(true)
  })

  it('applies a custom speed', () => {
    const controls = makeControls()
    const tour = createCameraTour({ controls, speed: 2.4 })
    tour.start()
    expect(controls.autoRotateSpeed).toBe(2.4)
  })

  it('stop disables autoRotate and toggle flips it back', () => {
    const controls = makeControls()
    const tour = createCameraTour({ controls })
    tour.start()
    tour.stop()
    expect(controls.autoRotate).toBe(false)
    expect(tour.isRunning()).toBe(false)
    tour.toggle()
    expect(controls.autoRotate).toBe(true)
    tour.toggle()
    expect(controls.autoRotate).toBe(false)
  })

  it('setSpeed updates the live speed', () => {
    const controls = makeControls()
    const tour = createCameraTour({ controls, speed: 1 })
    tour.start()
    tour.setSpeed(-1.5)
    expect(controls.autoRotateSpeed).toBe(-1.5)
  })

  it('autoStart begins orbiting immediately', () => {
    const controls = makeControls()
    createCameraTour({ controls, autoStart: true })
    expect(controls.autoRotate).toBe(true)
  })
})
