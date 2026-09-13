import { apiClient } from '#/config/axios'

export type CurrentDocument = {
  graph_id: string
  content: unknown
  version: number
  updated_at: string
}

type ApiResponse<T> = { success: boolean; data: T; message: string }

export async function getDocument(graphId: string): Promise<CurrentDocument> {
  const { data: result } = await apiClient.get<ApiResponse<CurrentDocument>>(
    `/documents/${graphId}`,
  )
  if (!result.success) throw new Error(result.message || 'Failed to fetch document')
  return result.data
}

export async function putDocument(
  graphId: string,
  payload: { content: unknown; baseVersion?: number },
): Promise<CurrentDocument> {
  const { data: result } = await apiClient.put<ApiResponse<CurrentDocument>>(
    `/documents/${graphId}`,
    payload,
  )
  if (!result.success) throw new Error(result.message || 'Failed to save document')
  return result.data
}
