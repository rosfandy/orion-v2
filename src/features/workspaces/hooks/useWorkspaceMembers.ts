import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { WorkspaceMember } from '#/features/workspaces/services/workspaceService'
import {
  addWorkspaceMember,
  getWorkspace,
  removeWorkspaceMember,
  searchUserByEmailExact,
} from '#/features/workspaces/services/workspaceService'
import { isWorkspaceCreator } from '#/features/workspaces/services/workspaceMembersService'

export const workspaceMembersQueryKey = (workspaceId: string) =>
  ['workspace-members', workspaceId] as const

type UseWorkspaceMembersOptions = {
  workspaceId: string
  currentUserId?: string
}

/**
 * Fetches workspace details + members and provides mutations for
 * adding/removing members + searching users by exact email.
 * Caller must pass `currentUserId` (from auth service) so we can
 * derive the `isCreator` flag at render time.
 */
export function useWorkspaceMembers({
  workspaceId,
  currentUserId,
}: UseWorkspaceMembersOptions) {
  const queryClient = useQueryClient()

  const { data: workspace, isLoading, error, refetch } = useQuery({
    queryKey: workspaceMembersQueryKey(workspaceId),
    queryFn: () => getWorkspace(workspaceId),
  })

  const members = Array.isArray(workspace?.members)
    ? (workspace.members as WorkspaceMember[])
    : []

  // Derive creator status inline — requires exactly one member with role === 'creator'
  let isCreator = false
  if (currentUserId && members.length > 0) {
    isCreator = isWorkspaceCreator(currentUserId, members)
  }

  const addMutation = useMutation({
    mutationFn: (userId: string) => addWorkspaceMember(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workspaceMembersQueryKey(workspaceId),
      })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeWorkspaceMember(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workspaceMembersQueryKey(workspaceId),
      })
    },
  })

  const searchMutation = useMutation({
    mutationFn: (email: string) => searchUserByEmailExact(email),
  })

  return {
    members,
    isCreator,
    isLoading,
    error,
    refetch,
    addMember: addMutation.mutateAsync,
    removeMember: removeMutation.mutateAsync,
    searchUserByEmail: searchMutation.mutateAsync,
    addIsPending: addMutation.isPending,
    removeIsPending: removeMutation.isPending,
    searchIsPending: searchMutation.isPending,
    isMutating: addMutation.isPending || removeMutation.isPending || searchMutation.isPending,
  }
}
