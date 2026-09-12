import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { useWorkspaces, workspacesQueryKey } from '#/features/workspaces/hooks/useWorkspaces'
import * as workspaceService from '#/features/workspaces/services/workspaceService'
import type { UseWorkspacesReturn } from './useWorkspaces'

const defaultWsList = [
  { id: 'ws-1', name: 'Alpha', graph_id: 'g1', members: [] },
]

// ---- Mock every exported service function so the hook calls don't hit axios ----

vi.mock('#/config/axios', () => ({
  apiClient: { request: vi.fn(), get: vi.fn() },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function makeMockServer(mockFn: ReturnType<typeof vi.spyOn>, value: unknown): void {
  mockFn.mockResolvedValue(value as any)
}

describe('useWorkspaces — mutation invalidation', () => {
  let queryClient: QueryClient
  let invalidateSpy: ReturnType<typeof vi.spyOn>

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
  })

  afterEach(() => {
    queryClient.clear()
  })

  /** Helper to set up all needed mocks once per test */
  function setupMocks(
    sAddMember: ReturnType<typeof vi.spyOn>,
    sRemoveMember: ReturnType<typeof vi.spyOn>,
    sSearch: ReturnType<typeof vi.spyOn>,
    sList: ReturnType<typeof vi.spyOn>,
    sCreate: ReturnType<typeof vi.spyOn>,
    sUpdate: ReturnType<typeof vi.spyOn>,
    sDelete: ReturnType<typeof vi.spyOn>,
    sGet: ReturnType<typeof vi.spyOn>,
  ): void {
    makeMockServer(sAddMember, defaultWsList[0])
    makeMockServer(sRemoveMember, defaultWsList[0])
    makeMockServer(sSearch, { id: 'u-1', name: 'Ada', email: 'a@b.com' })
    makeMockServer(sList, defaultWsList)
    makeMockServer(sCreate, defaultWsList[0])
    makeMockServer(sUpdate, defaultWsList[0])
    makeMockServer(sDelete, undefined)
    makeMockServer(sGet, defaultWsList[0])
  }

  // ── add member → invalidates ────────────────────────

  it('addMember triggers invalidateQueries on workspacesQueryKey', async () => {
    const sAddMember = vi.spyOn(workspaceService, 'addWorkspaceMember')
    const sRemoveMember = vi.spyOn(workspaceService, 'removeWorkspaceMember')
    const sSearch = vi.spyOn(workspaceService, 'searchUserByEmailExact')
    const sList = vi.spyOn(workspaceService, 'listWorkspaces')
    const sCreate = vi.spyOn(workspaceService, 'createWorkspace')
    const sUpdate = vi.spyOn(workspaceService, 'updateWorkspace')
    const sDelete = vi.spyOn(workspaceService, 'deleteWorkspace')
    const sGet = vi.spyOn(workspaceService, 'getWorkspace')

    setupMocks(sAddMember, sRemoveMember, sSearch, sList, sCreate, sUpdate, sDelete, sGet)

    const { result } = renderHook(() => useWorkspaces(), { wrapper })

    await (result.current as UseWorkspacesReturn).addMember('ws-1', 'new@example.com')

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: workspacesQueryKey }),
      )
    })
  })

  // ── remove member → invalidates ──────────────────────

  it('removeMember triggers invalidateQueries on workspacesQueryKey', async () => {
    const sAddMember = vi.spyOn(workspaceService, 'addWorkspaceMember')
    const sRemoveMember = vi.spyOn(workspaceService, 'removeWorkspaceMember')
    const sSearch = vi.spyOn(workspaceService, 'searchUserByEmailExact')
    const sList = vi.spyOn(workspaceService, 'listWorkspaces')
    const sCreate = vi.spyOn(workspaceService, 'createWorkspace')
    const sUpdate = vi.spyOn(workspaceService, 'updateWorkspace')
    const sDelete = vi.spyOn(workspaceService, 'deleteWorkspace')
    const sGet = vi.spyOn(workspaceService, 'getWorkspace')

    setupMocks(sAddMember, sRemoveMember, sSearch, sList, sCreate, sUpdate, sDelete, sGet)

    const { result } = renderHook(() => useWorkspaces(), { wrapper })

    await (result.current as UseWorkspacesReturn).removeMember('ws-1', 'user-x')

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: workspacesQueryKey }),
      )
    })
  })

  // ── search does NOT invalidate ──────────────────────

  it('searchUserByEmail does NOT trigger workspacesQueryKey invalidation', async () => {
    const sAddMember = vi.spyOn(workspaceService, 'addWorkspaceMember')
    const sRemoveMember = vi.spyOn(workspaceService, 'removeWorkspaceMember')
    const sSearch = vi.spyOn(workspaceService, 'searchUserByEmailExact')
    const sList = vi.spyOn(workspaceService, 'listWorkspaces')
    const sCreate = vi.spyOn(workspaceService, 'createWorkspace')
    const sUpdate = vi.spyOn(workspaceService, 'updateWorkspace')
    const sDelete = vi.spyOn(workspaceService, 'deleteWorkspace')
    const sGet = vi.spyOn(workspaceService, 'getWorkspace')

    setupMocks(sAddMember, sRemoveMember, sSearch, sList, sCreate, sUpdate, sDelete, sGet)

    const { result } = renderHook(() => useWorkspaces(), { wrapper })

    await (result.current as UseWorkspacesReturn).searchUserByEmail('ada@example.com')

    await waitFor(() => {
      expect(invalidateSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: workspacesQueryKey }),
      )
    })
  })
})
