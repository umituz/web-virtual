export type LabelOverrides<T> = {
  [K in keyof T]?: T[K] extends object ? LabelOverrides<T[K]> : T[K]
}

export function formatTemplate(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  )
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function mergeLabels<T extends object>(defaults: T, overrides?: LabelOverrides<T>): T {
  if (!overrides) return defaults
  const merged = { ...(defaults as unknown as Record<string, unknown>) }
  const source = overrides as unknown as Record<string, unknown>
  for (const key of Object.keys(source)) {
    const override = source[key]
    if (override === undefined) continue
    const base = (defaults as unknown as Record<string, unknown>)[key]
    merged[key] =
      isPlainObject(base) && isPlainObject(override)
        ? mergeLabels(base, override)
        : override
  }
  return merged as T
}
