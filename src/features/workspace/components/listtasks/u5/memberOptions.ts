import { useQuery } from '@tanstack/react-query'
import { getWorkspace } from '#/features/workspaces/services/workspaceService'
import type {
  Workspace,
  WorkspaceMember,
} from '#/features/workspaces/services/workspaceService'

export type MemberOption = {
  id: string
  name: string
  email?: string
  color?: string
}

export const MEMBER_COLOR_PALETTE = [
  '#2563eb',
  '#d83b7d',
  '#f3533b',
  '#e02d3c',
  '#0f9d58',
  '#7c3aed',
  '#e63980',
  '#00897b',
]

export function memberColor(id: string, name: string): string {
  const seed = `${id}:${name}`
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return MEMBER_COLOR_PALETTE[hash % MEMBER_COLOR_PALETTE.length]
}

export function resolveMemberId(member: WorkspaceMember): string {
  const candidates = [member.user?.id, member.userId, member.id]
  for (const candidate of candidates) {
    const id = candidate?.trim()
    if (id) return id
  }
  return ''
}

export function workspaceToMemberOptions(
  workspace?: Workspace | null,
): MemberOption[] {
  const members = workspace?.members
  if (!Array.isArray(members)) return []
  const seen = new Set<string>()
  const options: MemberOption[] = []
  for (const member of members) {
    const id = resolveMemberId(member)
    if (!id || seen.has(id)) continue
    seen.add(id)
    const name = member.user?.name?.trim() || id
    options.push({
      id,
      name,
      email: member.user?.email,
      color: memberColor(id, name),
    })
  }
  return options
}

export function useWorkspaceMembers(workspaceId?: string) {
  const query = useQuery({
    queryKey: ['workspaces', workspaceId],
    queryFn: () => getWorkspace(workspaceId as string),
    enabled: Boolean(workspaceId),
  })
  return {
    members: workspaceToMemberOptions(query.data),
    isLoading: query.isLoading,
    error: query.error,
  }
}