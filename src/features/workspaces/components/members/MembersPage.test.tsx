import { beforeEach, describe, expect, it, vi } from 'vitest'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock config
vi.mock('#/config/axios', () => ({
  apiClient: { request: vi.fn(), get: vi.fn() },
}))

// Mock auth hook so MemberListTable's useCurrentUserId() returns a known value
vi.mock('#/features/auth/hooks/useCurrentUserId', () => ({
  useCurrentUserId: vi.fn(() => 'user-creator'),
}))

const sAdd = vi.fn().mockResolvedValue(undefined)
const sRemove = vi.fn().mockResolvedValue(undefined)
const sSearch = vi.fn().mockResolvedValue({ id: 'u-x', name: 'X', email: 'x@x.com' })

vi.mock('#/features/workspaces/services/workspaceService', () => ({
  getWorkspace: vi.fn().mockResolvedValue({ id: 'ws-1', graph_id: 'g1', name: '', members: [] }),
  addWorkspaceMember: (...args: unknown[]) => sAdd(...args),
  removeWorkspaceMember: (...args: unknown[]) => sRemove(...args),
  searchUserByEmailExact: (...args: unknown[]) => sSearch(...args),
  listWorkspaces: vi.fn().mockResolvedValue([]),
  createWorkspace: vi.fn().mockResolvedValue(undefined),
  updateWorkspace: vi.fn().mockResolvedValue(undefined),
  deleteWorkspace: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('#/features/workspaces/services/workspaceMembersService', () => ({
  isWorkspaceCreator: vi.fn((userId: string, members: unknown[]) => {
    if (!userId || !members || !Array.isArray(members)) return false
    const creators = (members as Array<{ userId: string; role: string }>).filter(
      (m) => m.role === 'creator',
    )
    return creators.length === 1 && creators[0].userId === userId
  }),
}))

// Use a mutable object so the closure captures the latest value
const _state = { members: [] as unknown[], isCreator: true as boolean }

vi.mock('#/features/workspaces/hooks/useWorkspaceMembers', () => ({
  useWorkspaceMembers: (_opts: unknown) => ({
    members: _state.members,
    isCreator: _state.isCreator,
    isLoading: false,
    error: null,
    refetch: () => {},
    addMember: sAdd.bind(null, 'ws-1'),
    removeMember: sRemove.bind(null, 'ws-1'),
    searchUserByEmail: sSearch,
    searchIsPending: false,
    isMutating: false,
  }),
}))

const { MembersPage } = await import('./MembersPage')

const creator = {
  id: 'm-1', userId: 'user-creator', workspaceId: 'ws-1', role: 'creator',
  user: { id: 'user-creator', name: 'Creator User', email: 'creator@example.com' },
}
const memberA = {
  id: 'm-2', userId: 'user-member-a', workspaceId: 'ws-1', role: 'member',
  user: { id: 'user-member-a', name: 'Member A', email: 'a@example.com' },
}
const memberB = {
  id: 'm-3', userId: 'user-member-b', workspaceId: 'ws-1', role: 'member',
  user: { id: 'user-member-b', name: 'User B', email: 'b@example.com' },
}
const admin = {
  id: 'm-4', userId: 'user-admin', workspaceId: 'ws-1', role: 'admin',
  user: { id: 'user-admin', name: 'Admin User', email: 'admin@example.com' },
}

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  return { ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>), queryClient: client }
}

beforeEach(() => {
  vi.clearAllMocks()
})

function setMockState(members: unknown[], isCreator: boolean) {
  _state.members = members
  _state.isCreator = isCreator
}

// ── 1. Access control ─────────────────────────────────────────

describe('Access control', () => {
  it('shows + Add member button when user IS creator', async () => {
    setMockState([creator, memberA], true)
    renderWithProviders(<MembersPage workspaceId="ws-1" currentUserId="user-creator" />)

    await waitFor(() => screen.getByText(/Manage who has access/))
    expect(screen.getByRole('button', { name: /add member/i })).toBeInTheDocument()
    expect(screen.getByText(/you/i)).toBeInTheDocument()
  })

  it('hides + Add member and shows read-only message when NOT creator', async () => {
    setMockState([creator], false)
    renderWithProviders(<MembersPage workspaceId="ws-1" currentUserId="user-reader" />)

    await waitFor(() => screen.getByText(/Manage who has access/))
    expect(screen.queryByRole('button', { name: /add member/i })).not.toBeInTheDocument()
    expect(
      screen.getByText(/Read-only: only the workspace creator can manage members/i),
    ).toBeInTheDocument()
  })

  it('does NOT show Remove action for non-creator on any row', async () => {
    setMockState([creator, memberA, memberB], false)
    renderWithProviders(<MembersPage workspaceId="ws-1" currentUserId="user-reader" />)

    await waitFor(() => screen.getByText(/Manage who has access/))
    expect(screen.queryAllByRole('button', { name: /remove/i })).toHaveLength(0)
  })
})

// ── 2. Self-remove guard ──────────────────────────────────────

describe('Self-remove guard', () => {
  it('shows You label for the current-user row, not Remove', async () => {
    setMockState([creator, memberA], true)
    renderWithProviders(<MembersPage workspaceId="ws-1" currentUserId="user-creator" />)

    await waitFor(() => screen.getByText(/Manage who has access/))
    expect(screen.getByText(/you/i)).toBeInTheDocument()
  })

  it('shows Remove button for other members (not self)', async () => {
    setMockState([creator, memberA, memberB], true)
    renderWithProviders(<MembersPage workspaceId="ws-1" currentUserId="user-creator" />)

    await waitFor(() => screen.getByText(/Manage who has access/))
    const removeBtns = screen.getAllByRole('button', { name: /remove/i })
    expect(removeBtns.length).toBeGreaterThanOrEqual(1)
  })
})

// ── 3. Direct add ────────────────────────────────────────────

describe('Direct add', () => {
  it('clicking found user triggers direct add without confirmation', async () => {
    setMockState([creator], true)
    sSearch.mockResolvedValueOnce({ id: 'u-new', name: 'New', email: 'x@y.com' })

    renderWithProviders(<MembersPage workspaceId="ws-1" currentUserId="user-creator" />)

    await waitFor(() => screen.getByText(/Manage who has access/))
    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    await userEvent.type(screen.getByLabelText(/email address/i), 'x@y.com')
    await userEvent.click(screen.getByRole('button', { name: /search/i }))

    await waitFor(() => expect(sSearch).toHaveBeenCalled())
    await userEvent.click(screen.getByRole('button', { name: /add member/i }))

    await waitFor(() => {
      expect(sAdd).toHaveBeenCalledWith('ws-1', 'x@y.com')
    })
  })

  it('does not show a role selector or confirmation modal', async () => {
    setMockState([creator], true)
    sSearch.mockResolvedValueOnce({ id: 'u-new', name: 'New', email: 'z@z.com' })

    renderWithProviders(<MembersPage workspaceId="ws-1" currentUserId="user-creator" />)

    await waitFor(() => screen.getByText(/Manage who has access/))
    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    await userEvent.type(screen.getByLabelText(/email address/i), 'z@z.com')
    await userEvent.click(screen.getByRole('button', { name: /search/i }))

    await waitFor(() => expect(sSearch).toHaveBeenCalled())

    expect(screen.queryByDisplayValue('admin')).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue('member')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText(/confirm/i)).not.toBeInTheDocument()
  })
})

// ── 4. Not-found state ────────────────────────────────────────

describe('Not-found', () => {
  it('shows register-first message; no invite-email action', async () => {
    setMockState([creator], true)
    sSearch.mockRejectedValueOnce(new Error('not found'))

    renderWithProviders(<MembersPage workspaceId="ws-1" currentUserId="user-creator" />)

    await waitFor(() => screen.getByText(/Manage who has access/))
    await userEvent.click(screen.getByRole('button', { name: /add member/i }))
    await userEvent.type(screen.getByLabelText(/email address/i), 'ghost@example.com')
    await userEvent.click(screen.getByRole('button', { name: /search/i }))

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert')
      return expect(alerts[0]).toHaveTextContent(/no account found/i)
    })

    expect(screen.queryByRole('button', { name: /send invite/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /invite/i })).not.toBeInTheDocument()
  })
})

// ── 5. Failure handling ───────────────────────────────────────

describe('Failure handling', () => {
  it('keeps member rows intact when removeMember fails', async () => {
    setMockState([creator, memberB], true)
    sRemove.mockRejectedValueOnce(new Error('network error'))

    renderWithProviders(<MembersPage workspaceId="ws-1" currentUserId="user-creator" />)

    await waitFor(() => screen.getByText(/Manage who has access/))

    await userEvent.click(screen.getByRole('button', { name: /remove user b/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to remove/i)
    })
    expect(screen.getByText(/User B/i)).toBeInTheDocument()
  })
})

// ── 6. Role badges ────────────────────────────────────────────

describe('Role display', () => {
  it('renders Creator badge', async () => {
    setMockState([creator], true)
    renderWithProviders(<MembersPage workspaceId="ws-1" currentUserId="user-creator" />)
    await waitFor(() => screen.getByText(/Manage who has access/))
    expect(screen.getByText('Creator')).toBeInTheDocument()
  })

  it('renders Admin badge', async () => {
    setMockState([admin], true)
    renderWithProviders(<MembersPage workspaceId="ws-1" currentUserId="user-creator" />)
    await waitFor(() => screen.getByText(/Manage who has access/))
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('renders Member badge', async () => {
    setMockState([memberA], true)
    renderWithProviders(<MembersPage workspaceId="ws-1" currentUserId="user-creator" />)
    await waitFor(() => screen.getByText(/Manage who has access/))
    // Query the role badge cell (second th-like span in the first data row) to avoid table header "Member"
    const roleSpans = screen.getAllByText(/^Member$/, { selector: 'span' })
    expect(roleSpans.length).toBeGreaterThanOrEqual(2)
  })
})
