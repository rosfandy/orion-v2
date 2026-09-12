import type { WorkspaceMember } from './workspaceService'

/**
 * Derive creator state from the current user id and the workspace members list.
 * Returns `true` when exactly one member has role === 'creator' AND that member
 * owns the supplied userId.  Returns `false` otherwise (zero creators, multiple
 * creators, or different owner).
 */
export function isWorkspaceCreator(
  userId: string | undefined,
  members: WorkspaceMember[] | undefined,
): boolean {
  if (!userId || !members) return false

  const creators = members.filter((m) => m.role === 'creator')
  return creators.length === 1 && creators[0].userId === userId
}
