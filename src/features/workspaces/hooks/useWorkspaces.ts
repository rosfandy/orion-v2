import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addWorkspaceMember,
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  listWorkspaces,
  removeWorkspaceMember,
  searchUserByEmailExact,
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
    mutationFn: ({ id, email }: { id: string; email: string }) =>
      addWorkspaceMember(id, email),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey }),
  })
  const removeMemberMutation = useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      removeWorkspaceMember(id, userId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey }),
  })
  const searchMemberMutation = useMutation({
    mutationFn: (email: string) => searchUserByEmailExact(email),
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
    addMember: (id: string, email: string) =>
      memberMutation.mutateAsync({ id, email }),
    removeMember: (id: string, userId: string) =>
      removeMemberMutation.mutateAsync({ id, userId }),
    searchUserByEmail: (email: string) =>
      searchMemberMutation.mutateAsync(email),
    isMutating:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      memberMutation.isPending ||
      removeMemberMutation.isPending ||
      searchMemberMutation.isPending,
  }
}
