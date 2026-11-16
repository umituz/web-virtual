/**
 * Deterministic seeded pseudo-random numbers (mulberry32). Builders scatter
 * vegetation, herds and props through this so a given seed always produces
 * the exact same scene — stable across reloads, hot-syncs and screenshots.
 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Map a numeric seed and an index into a stable 0..2π phase offset. */
export function phaseFor(seed: number, index: number): number {
  return (Math.imul(seed ^ index, 0x9e3779b1) >>> 0) / 4294967296 * Math.PI * 2
}

/** Small deterministic jitter around a base value, in ±amount. */
export function jitter(rng: () => number, base: number, amount: number): number {
  return base + (rng() * 2 - 1) * amount
}
