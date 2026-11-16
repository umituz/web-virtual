/**
 * Clock helpers for day/night theming. Pure, timezone-local by design: the
 * viewer's own hour decides, so a world page defaults to night without any
 * consumer-side plumbing.
 */

/** True when the given clock falls inside the night window `[from, to)`
 *  (wraps past midnight, e.g. 19 → 7). */
export function isNightHour(fromHour = 19, toHour = 7, at: Date = new Date()): boolean {
  const h = at.getHours()
  if (fromHour <= toHour) {
    return h >= fromHour && h < toHour
  }
  return h >= fromHour || h < toHour
}
