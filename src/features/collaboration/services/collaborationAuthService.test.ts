import { describe, expect, it, vi } from 'vitest'
import { getCollaborationAuth } from './collaborationAuthService'
import * as axiosModule from '#/config/axios'

vi.mock('#/config/axios', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
  },
}))

describe('collaborationAuthService.getCollaborationAuth', () => {
  it('posts graphId + workspaceId to /collaboration/auth', async () => {
    const mockPost = vi.spyOn(axiosModule.apiClient, 'post')
    mockPost.mockResolvedValueOnce({
      data: { success: true, data: { room: 'r', websocketUrl: 'wss://h/collaboration' }, message: '' },
    } as any)

    const result = await getCollaborationAuth('doc-1', 'ws-1')

    expect(mockPost).toHaveBeenCalledWith('/collaboration/auth', {
      graphId: 'doc-1',
      workspaceId: 'ws-1',
    })
    expect(result).toEqual({ room: 'r', websocketUrl: 'wss://h/collaboration' })
  })

  it('throws on non-success response', async () => {
    const mockPost = vi.spyOn(axiosModule.apiClient, 'post')
    mockPost.mockResolvedValueOnce({
      data: { success: false, data: null, message: 'Not found' },
    } as any)

    await expect(getCollaborationAuth('doc-1', 'ws-1')).rejects.toThrow(
      'Not found',
    )
  })
})
