export function dedupeTagIds(ids: string[]): string[] {
  return Array.from(new Set(ids))
}

export function parseTagIds(value: unknown): string[] {
  if (typeof value !== 'string') return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return dedupeTagIds(
      parsed.filter((item): item is string => typeof item === 'string'),
    )
  } catch {
    return []
  }
}

export function serializeTagIds(ids: string[]): string {
  return JSON.stringify(dedupeTagIds(ids))
}

export function toggleTagId(selected: string[], id: string): string[] {
  return selected.includes(id)
    ? selected.filter((selectedId) => selectedId !== id)
    : dedupeTagIds([...selected, id])
}