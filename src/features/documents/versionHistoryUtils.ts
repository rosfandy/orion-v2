import type { DocumentVersion } from '#/features/documents/services/documentVersionService'
import { VersionHistoryFullError } from '#/features/documents/services/documentVersionService'

/** Sort versions newest first (highest version_number first). */
export function sortVersionsNewestFirst(versions: DocumentVersion[]): DocumentVersion[] {
  return [...versions].sort((a, b) => b.version_number - a.version_number)
}

/** Check whether the VERSION_HISTORY_FULL conflict is active. */
export function isHistoryFull(error: unknown): boolean {
  return error instanceof VersionHistoryFullError
}
