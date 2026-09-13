import { apiClient } from '#/config/axios'
import type { CollaborationAuthData } from '../types'

export interface CollaborationAuthPayload {
  graphId: string
  workspaceId: string
}

export interface CollaborationAuthResponse {
  success: boolean
  data: CollaborationAuthData
  message: string
}

/**
 * Fetches authorized PartyKit room connection data from the backend.
 * Throws on non-success response so callers can surface the error.
 */
export async function getCollaborationAuth(
  graphId: string,
  workspaceId: string,
): Promise<CollaborationAuthData> {
  const url = `/collaboration/auth`
  console.log('[collab-auth] POST', url, { graphId, workspaceId })
  try {
    const { data: result } = await apiClient.post<CollaborationAuthResponse>(url, { graphId, workspaceId })
    if (!result.success) {
      console.error('[collab-auth] failed', result.message)
      throw new Error(result.message || 'Collaboration auth failed')
    }
    console.log('[collab-auth] ok', result.data)
    return result.data
  } catch (err) {
    console.error('[collab-auth] error', err)
    throw err
  }
}
