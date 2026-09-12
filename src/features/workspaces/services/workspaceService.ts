import { apiClient } from '#/config/axios'

export type SearchUser = { id: string; name: string; email: string }

export type Workspace = {
  id: string
  graph_id: string
  name: string
  description?: string
  members?: number | WorkspaceMember[]
  plan?: string
}

export type WorkspaceMember = {
  id: string
  workspaceId: string
  userId: string
  role: string
  user?: { id?: string; name?: string; email?: string }
}

export type WorkspaceInput = { name: string; description?: string }
type ApiResponse<T> = { success: boolean; data: T; message: string }

async function request<T>(config: Parameters<typeof apiClient.request>[0]) {
  const { data: result } = await apiClient.request<ApiResponse<T>>(config)
  if (!result.success)
    throw new Error(result.message || 'Workspace request failed')
  return result.data
}

export async function listWorkspaces() {
  const data = await request<Workspace[] | { workspaces: Workspace[] }>({
    url: '/workspaces',
  })
  return Array.isArray(data) ? data : data.workspaces
}

export function getWorkspace(id: string) {
  return request<Workspace>({ url: `/workspaces/${id}` })
}
export function createWorkspace(input: WorkspaceInput) {
  return request<Workspace>({ url: '/workspaces', method: 'POST', data: input })
}
export function updateWorkspace(id: string, input: Partial<WorkspaceInput>) {
  return request<Workspace>({
    url: `/workspaces/${id}`,
    method: 'PATCH',
    data: input,
  })
}
export function deleteWorkspace(id: string) {
  return request<void>({ url: `/workspaces/${id}`, method: 'DELETE' })
}
export function addWorkspaceMember(id: string, email: string) {
  return request<Workspace>({
    url: `/workspaces/${id}/members`,
    method: 'POST',
    data: { email },
  })
}

export async function searchUserByEmailExact(email: string): Promise<SearchUser> {
  const { data: result } = await apiClient.get<{ success: boolean; data: SearchUser; message: string }>(
    '/users/search/email',
    { params: { email } },
  )
  if (!result.success) throw new Error(result.message || 'User search failed')
  return result.data
}

export function removeWorkspaceMember(id: string, userId: string) {
  return request<Workspace>({
    url: `/workspaces/${id}/members/${userId}`,
    method: 'DELETE',
  })
}
