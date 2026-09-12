import { describe, expect, it } from 'vitest'
import type { Workspace } from '#/features/workspaces/services/workspaceService'
import {
  MEMBER_COLOR_PALETTE,
  memberColor,
  resolveMemberId,
  workspaceToMemberOptions,
} from './memberOptions'

function workspace(members: Workspace['members']): Workspace {
  return { id: 'w1', graph_id: 'g1', name: 'W', members }
}

describe('workspaceToMemberOptions', () => {
  it('maps workspace members to assignee options using user profile', () => {
    const ws = workspace([
      {
        id: 'm1',
        workspaceId: 'w1',
        userId: 'u1',
        role: 'member',
        user: { id: 'u1', name: 'Alice', email: 'alice@x.com' },
      },
      {
        id: 'm2',
        workspaceId: 'w1',
        userId: 'u2',
        role: 'admin',
        user: { id: 'u2', name: 'Bob Reyes' },
      },
    ])

    expect(workspaceToMemberOptions(ws)).toEqual([
      {
        id: 'u1',
        name: 'Alice',
        email: 'alice@x.com',
        color: memberColor('u1', 'Alice'),
      },
      {
        id: 'u2',
        name: 'Bob Reyes',
        color: memberColor('u2', 'Bob Reyes'),
      },
    ])
    expect(workspaceToMemberOptions(ws)).toHaveLength(2)
  })

  it('returns empty array when members is a count, not a list', () => {
    expect(workspaceToMemberOptions(workspace(5))).toEqual([])
  })

  it('falls back to userId and then member id when no user id exists', () => {
    const ws = workspace([
      { id: 'm1', workspaceId: 'w1', userId: 'u1', role: 'member' },
      { id: 'm2', workspaceId: 'w1', userId: '', role: 'member' },
    ])
    const options = workspaceToMemberOptions(ws)
    expect(options[0].id).toBe('u1')
    expect(options[1].id).toBe('m2')
    expect(options[1].name).toBe('m2')
  })

  it('omits members that have no resolvable id', () => {
    const ws = workspace([
      { id: '', workspaceId: 'w1', userId: '', role: 'member' },
    ])
    expect(workspaceToMemberOptions(ws)).toEqual([])
  })

  it('dedupes members that share the same resolved user id', () => {
    const ws = workspace([
      {
        id: 'm1',
        workspaceId: 'w1',
        userId: 'u1',
        role: 'member',
        user: { id: 'u1', name: 'Alice' },
      },
      {
        id: 'm2',
        workspaceId: 'w1',
        userId: 'u1',
        role: 'admin',
        user: { id: 'u1', name: 'Alice' },
      },
    ])
    expect(workspaceToMemberOptions(ws)).toHaveLength(1)
  })

  it('returns empty array for undefined or null workspace', () => {
    expect(workspaceToMemberOptions(undefined)).toEqual([])
    expect(workspaceToMemberOptions(null)).toEqual([])
  })
})

describe('resolveMemberId', () => {
  it('prefers user.id over userId over member id', () => {
    expect(
      resolveMemberId({
        id: 'm1',
        workspaceId: 'w1',
        userId: '',
        role: 'member',
        user: { id: 'u1' },
      }),
    ).toBe('u1')
  })
})

describe('memberColor', () => {
  it('is deterministic for the same member', () => {
    expect(memberColor('u1', 'Alice')).toBe(memberColor('u1', 'Alice'))
  })

  it('returns a color from the palette', () => {
    expect(MEMBER_COLOR_PALETTE).toContain(memberColor('u9', 'Zeta Omega'))
  })
})