import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addWorkspaceMember,
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  listWorkspaces,
  updateWorkspace,
} from '#/features/workspaces/services/workspaceService'
import type { WorkspaceInput } from '#/features/workspaces/services/workspaceService'

export const workspacesQueryKey = ['workspaces'] as const

export function useWorkspaces() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: workspacesQueryKey,
    queryFn: listWorkspaces,
  })

  const createMutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey }),
  })
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<WorkspaceInput>
    }) => updateWorkspace(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey }),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey }),
  })
  const memberMutation = useMutation({
    mutationFn: ({
      id,
      email,
      role,
    }: {
      id: string
      email: string
      role?: string
    }) => addWorkspaceMember(id, email, role),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey }),
  })

  return {
    workspaces: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refresh: query.refetch,
    get: (id: string) => getWorkspace(id),
    create: (input: WorkspaceInput) => createMutation.mutateAsync(input),
    update: (id: string, input: Partial<WorkspaceInput>) =>
      updateMutation.mutateAsync({ id, input }),
    remove: (id: string) => deleteMutation.mutateAsync(id),
    addMember: (id: string, email: string, role = 'member') =>
      memberMutation.mutateAsync({ id, email, role }),
    isMutating:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      memberMutation.isPending,
  }
}
