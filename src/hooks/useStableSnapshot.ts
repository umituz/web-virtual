/**
 * Freeze the first non-null value for the lifetime of the visit. Later
 * refetches/recomputations never replace the snapshot — essential for world
 * builds, where a rebuilt scene would steal the user's camera angle.
 *
 *   const build = useStableSnapshot(useMemo(() => (loading ? null : buildWorld(data)), [loading, data]))
 */

import { useState } from 'react'

export function useStableSnapshot<T>(fresh: T | null | undefined): T | null {
  const [snapshot, setSnapshot] = useState<T | null>(fresh ?? null)
  if (fresh && snapshot === null && fresh !== snapshot) {
    setSnapshot(fresh)
  }
  return snapshot
}
