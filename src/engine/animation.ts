export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

export interface PhotoperiodOptions {
  periodSeconds?: number
  onFraction?: number
  fadeFraction?: number
}

export interface PhotoperiodFn {
  (elapsed: number): number
  readonly periodSeconds: number
  readonly onFraction: number
  readonly fadeFraction: number
}

export function createPhotoperiod(options: PhotoperiodOptions = {}): PhotoperiodFn {
  const periodSeconds = options.periodSeconds ?? 20
  const onFraction = Math.min(1, Math.max(0, options.onFraction ?? 0.7))
  const fadeFraction = Math.min(1, Math.max(0, options.fadeFraction ?? 0.12))
  const phase = (elapsed: number): number => {
    const cycle = (elapsed % periodSeconds + periodSeconds) % periodSeconds / periodSeconds
    const fadeIn = smoothstep(0, fadeFraction, cycle)
    const fadeOut = 1 - smoothstep(onFraction - fadeFraction, onFraction, cycle)
    const window = cycle < onFraction ? 1 : 0
    return Math.min(fadeIn, fadeOut, window)
  }
  const fn = phase as PhotoperiodFn
  Object.defineProperty(fn, 'periodSeconds', { value: periodSeconds })
  Object.defineProperty(fn, 'onFraction', { value: onFraction })
  Object.defineProperty(fn, 'fadeFraction', { value: fadeFraction })
  return fn
}
