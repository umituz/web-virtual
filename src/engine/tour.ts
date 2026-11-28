import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export interface CameraTourOptions {
  controls: OrbitControls
  speed?: number
  autoStart?: boolean
}

export interface CameraTourHandle {
  start(): void
  stop(): void
  toggle(): void
  isRunning(): boolean
  setSpeed(speed: number): void
}

export function createCameraTour(options: CameraTourOptions): CameraTourHandle {
  const { controls } = options
  let running = false

  const apply = (): void => {
    controls.autoRotate = running
    controls.autoRotateSpeed = options.speed ?? 0.8
  }

  const handle: CameraTourHandle = {
    start() {
      running = true
      apply()
    },
    stop() {
      running = false
      apply()
    },
    toggle() {
      running = !running
      apply()
    },
    isRunning() {
      return running
    },
    setSpeed(speed: number) {
      options.speed = speed
      apply()
    },
  }

  if (options.autoStart) handle.start()

  return handle
}
