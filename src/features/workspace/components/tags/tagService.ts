import { apiClient } from '#/config/axios'
import {
  buildCreateChildPayload,
  updateGraph,
} from '#/features/graphs/services/graphService'
import type { GraphSpace } from '#/features/graphs/services/graphService'

export type WorkspaceTag = {
  id: string
  name: string
}

type TagsResponse = {
  success: boolean
  data?: GraphSpace[]
  message: string
}

export async function getWorkspaceTags(
  workspaceId: string,
): Promise<WorkspaceTag[]> {
  if (!workspaceId) return []
  const { data: result } = await apiClient.get<TagsResponse>(
    '/graphs/label/tag',
    { params: { workspaceId } },
  )
  if (!result.success) throw new Error(result.message || 'Unable to load tags')
  return (result.data ?? []).map((node) => ({
    id: node.meta.id,
    name: node.meta.name,
  }))
}

export function buildCreateTagPayload(name: string, workspaceId: string) {
  return buildCreateChildPayload(workspaceId, {
    relation: 'HAS_TAGS',
    label: 'Tag',
    props: { name, workspaceId },
  })
}

export function createWorkspaceTag(name: string, workspaceId: string) {
  return updateGraph(workspaceId, {
    relation: 'HAS_TAGS',
    label: 'Tag',
    props: { name, workspaceId },
  })
}