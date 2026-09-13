import { apiClient } from '#/config/axios'

export type DocumentVersion = {
  id: string
  graph_id: string
  version_number: number
  created_at: string
  is_manual: boolean
  /** Snapshot of BlockNote JSON blocks at time of version creation. */
  content?: unknown
  /** Plain-text preview extracted from the BlockNote snapshot for listings. */
  text_preview?: string
}

export type CreateManualSnapshotInput = {
  graph_id: string
  note?: string
}

export type VersionListResponse = {
  success: boolean
  data: DocumentVersion[]
  message: string
}

export type VersionDetailResponse = {
  success: boolean
  data: DocumentVersion
  message: string
}

export type VersionDeleteResponse = {
  success: boolean
  data: null
  message: string
}

/** Error thrown when all 10 history slots are occupied by manual snapshots. */
export class VersionHistoryFullError extends Error {
  constructor(public readonly message: string) {
    super(message)
    this.name = 'VersionHistoryFullError'
  }
}

function assertSuccess<T>(result: { success: boolean; message: string }): T {
  if (!result.success) {
    const msg = result.message ?? 'Version request failed'
    if (msg.includes('VERSION_HISTORY_FULL') || msg.includes('history-full')) {
      throw new VersionHistoryFullError(msg)
    }
    throw new Error(msg)
  }
  return result as unknown as T
}

export async function listDocumentVersions(graph_id: string): Promise<DocumentVersion[]> {
  const { data: result } = await apiClient.get<VersionListResponse>(
    `/documents/${encodeURIComponent(graph_id)}/versions`,
  )
  assertSuccess(result)
  return result.data
}

export async function getDocumentVersion(
  graph_id: string,
  version_id: string,
): Promise<DocumentVersion> {
  const { data: result } = await apiClient.get<VersionDetailResponse>(
    `/documents/${encodeURIComponent(graph_id)}/versions/${encodeURIComponent(version_id)}`,
  )
  assertSuccess(result)
  return result.data
}

export async function createManualSnapshot(input: CreateManualSnapshotInput): Promise<DocumentVersion> {
  const { data: result } = await apiClient.post<VersionDetailResponse>(
    `/documents/${encodeURIComponent(input.graph_id)}/versions`,
    { ...(input.note ? { note: input.note } : {}) },
  )
  assertSuccess(result)
  return result.data
}

export async function deleteDocumentVersion(
  graph_id: string,
  version_id: string,
): Promise<void> {
  const { data: result } = await apiClient.delete<VersionDeleteResponse>(
    `/documents/${encodeURIComponent(graph_id)}/versions/${encodeURIComponent(version_id)}`,
  )
  assertSuccess(result)
}
