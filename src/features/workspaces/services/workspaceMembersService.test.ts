import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from '#/config/axios'
import {
  addWorkspaceMember,
  removeWorkspaceMember,
  searchUserByEmailExact,
} from './workspaceService'
import { isWorkspaceCreator } from './workspaceMembersService'
import type { SearchUser, WorkspaceMember } from './workspaceService'

vi.mock('#/config/axios', () => ({
  apiClient: {
    get: vi.fn(),
    request: vi.fn(),
  },
}))

const mockGet = vi.mocked(apiClient.get)
const mockRequest = vi.mocked(apiClient.request)

beforeEach(() => {
  vi.clearAllMocks()
})

// ──────────────────────────────────────────────
// addWorkspaceMember — payload contract
// ──────────────────────────────────────────────

describe('addWorkspaceMember', () => {
  it('POSTs /workspaces/:id/members with only { email }, without role', async () => {
    mockRequest.mockResolvedValue({
      data: { success: true, data: { id: 'ws-1', name: 'My Workspace' } as any, message: '' },
    })

    await addWorkspaceMember('ws-1', 'a@b.com')

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/workspaces/ws-1/members',
        method: 'POST',
        data: { email: 'a@b.com' },
      }),
    )

    const callData = (mockRequest.mock.calls[0][0] as any).data
    expect(callData).not.toHaveProperty('role')
    expect(Object.keys(callData)).toHaveLength(1)
  })
})

// ──────────────────────────────────────────────
// searchUserByEmailExact — request / response mapping
// ──────────────────────────────────────────────

describe('searchUserByEmailExact', () => {
  const fixture: SearchUser = { id: 'u-1', name: 'Ada', email: 'ada@example.com' }

  it('GETs /users/search/email with email query param', async () => {
    mockGet.mockResolvedValue({
      data: { success: true, data: fixture, message: '' },
    })

    await searchUserByEmailExact('ada@example.com')

    expect(mockGet).toHaveBeenCalledWith('/users/search/email', {
      params: { email: 'ada@example.com' },
    })
  })

  it('returns typed { id, name, email } from response.data', async () => {
    mockGet.mockResolvedValue({
      data: { success: true, data: fixture, message: '' },
    })

    const result = await searchUserByEmailExact('ada@example.com')

    expect(result).toEqual(fixture)
    expect(typeof result.id).toBe('string')
    expect(typeof result.name).toBe('string')
    expect(typeof result.email).toBe('string')
  })

  it('throws when response.success is false', async () => {
    mockGet.mockResolvedValue({
      data: { success: false, data: null as unknown as SearchUser, message: 'not found' },
    })

    await expect(searchUserByEmailExact('x@y.com')).rejects.toThrow('not found')
  })
})

// ──────────────────────────────────────────────
// removeWorkspaceMember — URL & target
// ──────────────────────────────────────────────

describe('removeWorkspaceMember', () => {
  it('DELETEs /workspaces/:id/members/:userId', async () => {
    mockRequest.mockResolvedValue({
      data: { success: true, data: { id: 'ws-1', name: 'WS' } as any, message: '' },
    })

    await removeWorkspaceMember('ws-1', 'user-x')

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/workspaces/ws-1/members/user-x',
        method: 'DELETE',
      }),
    )
  })
})

// ──────────────────────────────────────────────
// isWorkspaceCreator — membership → creator derivation
// ──────────────────────────────────────────────

describe('isWorkspaceCreator', () => {
  const alice: WorkspaceMember = { id: 'm1', userId: 'alice', workspaceId: 'ws-1', role: 'creator' }
  const bob: WorkspaceMember = { id: 'm2', userId: 'bob', workspaceId: 'ws-1', role: 'member' }
  const charlie: WorkspaceMember = { id: 'm3', userId: 'charlie', workspaceId: 'ws-1', role: 'admin' }

  it('returns true when userId matches the sole creator member', () => {
    expect(isWorkspaceCreator('alice', [alice, bob])).toBe(true)
  })

  it('returns false when the member is not a creator', () => {
    expect(isWorkspaceCreator('bob', [alice, bob])).toBe(false)
  })

  it('returns false when userId has no matching member at all', () => {
    expect(isWorkspaceCreator('ghost', [alice, bob])).toBe(false)
  })

  it('returns false when multiple creators exist', () => {
    const dave: WorkspaceMember = { id: 'm4', userId: 'dave', workspaceId: 'ws-1', role: 'creator' }
    expect(isWorkspaceCreator('alice', [alice, dave])).toBe(false)
  })

  it('returns false for undefined members', () => {
    expect(isWorkspaceCreator('alice', undefined)).toBe(false)
  })

  it('returns false for undefined userId', () => {
    expect(isWorkspaceCreator(undefined, [alice])).toBe(false)
  })

  it('returns false for empty members array', () => {
    expect(isWorkspaceCreator('alice', [])).toBe(false)
  })

  it('ignores non-creator roles even if userId matches', () => {
    expect(isWorkspaceCreator('charlie', [charlie, bob])).toBe(false)
  })
})
