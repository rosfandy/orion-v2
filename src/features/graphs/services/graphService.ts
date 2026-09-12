import { apiClient } from '#/config/axios'

export type GraphMeta = {
  id: string
  name: string
  workspaceId?: string
  labels: string[]
  createdAt?: string
  status?: string
  assignee?: string
  duedate?: string
  priority?: string
  tags?: string
}

export type GraphRelation = {
  relation_id: string
  data: GraphMeta
} & GraphRelations

export type GraphRelations = {
  HAS_FOLDERS?: GraphRelation[]
  HAS_LISTS?: GraphRelation[]
  HAS_DOCUMENTS?: GraphRelation[]
  HAS_TASKS?: GraphRelation[]
  HAS_SUBTASK?: GraphRelation[]
  HAS_TAGS?: GraphRelation[]
}

export type GraphNode = { meta: GraphMeta } & GraphRelations
export type GraphSpace = GraphNode

type GraphResponse = { success: boolean; data: GraphSpace[]; message: string }
type GraphNodeResponse = { success: boolean; data: GraphNode; message: string }
type UpdateGraphResponse = {
  success: boolean
  data: unknown
  message: string
}

export async function getGraph(id: string) {
  const { data: result } = await apiClient.get<GraphResponse>(
    '/graphs/label/space',
    { params: { workspaceId: id } },
  )
  if (!result.success) throw new Error(result.message || 'Unable to load graph')
  return result.data
}

export async function getGraphById(id: string) {
  const { data: result } = await apiClient.get<GraphNodeResponse>(
    `/graphs/${id}`,
  )
  if (!result.success) {
    throw new Error(result.message || 'Unable to load graph node')
  }
  return result.data
}

export type CreateChildInput = {
  relation: string
  label: string
  name?: string
  props?: Record<string, unknown>
}

export type DirectPatchInput = {
  name?: string
  props?: Record<string, unknown>
}

export type GraphUpdateInput = CreateChildInput | DirectPatchInput

export function isCreateChild(input: unknown): input is CreateChildInput {
  if (typeof input !== 'object' || input === null) return false
  return 'relation' in input && 'label' in input
}

export function buildCreateChildPayload(_id: string, input: CreateChildInput) {
  const props: Record<string, unknown> = {}
  if (input.name !== undefined) props.name = input.name
  if (input.props !== undefined) Object.assign(props, input.props)
  return {
    children: [
      {
        relation: input.relation,
        label: input.label,
        props,
      },
    ],
  }
}

export function buildDirectPatchPayload(input: DirectPatchInput) {
  const props: Record<string, unknown> = {}
  if (input.name !== undefined) props.name = input.name
  if (input.props !== undefined) Object.assign(props, input.props)
  return { props }
}

export async function updateGraph(id: string, input: GraphUpdateInput) {
  const data = isCreateChild(input)
    ? buildCreateChildPayload(id, input)
    : buildDirectPatchPayload(input)
  const { data: result } = await apiClient.patch<UpdateGraphResponse>(
    `/graphs/${id}`,
    data,
  )
  if (!result.success)
    throw new Error(result.message || 'Unable to update graph')
  return result.data
}

export async function deleteGraph(id: string) {
  const { data: result } = await apiClient.delete<UpdateGraphResponse>(
    `/graphs/${id}`,
  )
  if (!result.success)
    throw new Error(result.message || 'Unable to delete graph')
  return result.data
}
