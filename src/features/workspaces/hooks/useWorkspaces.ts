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

/** Return type of useWorkspaces — exported for test consumers. */
export type UseWorkspacesReturn = {
  workspaces: any[]
  isLoading: boolean
  error: unknown
  refresh: () => Promise<any>
  get: (id: string) => Promise<any>
  create: (input: WorkspaceInput) => Promise<any>
  update: (id: string, input: Partial<WorkspaceInput>) => Promise<any>
  remove: (id: string) => Promise<void>
  addMember: (id: string, email: string) => Promise<any>
  removeMember: (id: string, userId: string) => Promise<any>
  searchUserByEmail: (email: string) => Promise<{ id: string; name: string; email: string }>
  isMutating: boolean
}

export function useWorkspaces(): UseWorkspacesReturn {
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
    refresh: () => query.refetch(),
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
