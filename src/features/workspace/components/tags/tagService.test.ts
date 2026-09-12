import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '#/config/axios'
import { buildCreateChildPayload } from '#/features/graphs/services/graphService'
import {
  buildCreateTagPayload,
  createWorkspaceTag,
  getWorkspaceTags,
} from './tagService'

vi.mock('#/config/axios', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

const mockGet = vi.mocked(apiClient.get)
const mockPatch = vi.mocked(apiClient.patch)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getWorkspaceTags - workspace query scope', () => {
  it('queries /graphs/label/tag scoped to the workspaceId', async () => {
    mockGet.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [
          { meta: { id: 'tag-1', name: 'Urgent', labels: ['Tag'] } },
          { meta: { id: 'tag-2', name: 'Bug', labels: ['Tag'] } },
        ],
      },
    })

    const tags = await getWorkspaceTags('ws-1')

    expect(mockGet).toHaveBeenCalledWith('/graphs/label/tag', {
      params: { workspaceId: 'ws-1' },
    })
    expect(tags).toEqual([
      { id: 'tag-1', name: 'Urgent' },
      { id: 'tag-2', name: 'Bug' },
    ])
  })

  it('does not fire a request for an empty workspaceId', async () => {
    const tags = await getWorkspaceTags('')
    expect(mockGet).not.toHaveBeenCalled()
    expect(tags).toEqual([])
  })

  it('throws when the response is unsuccessful', async () => {
    mockGet.mockResolvedValue({
      data: { success: false, message: 'nope', data: [] },
    })

    await expect(getWorkspaceTags('ws-1')).rejects.toThrow('nope')
  })

  it('maps empty data to an empty tag list', async () => {
    mockGet.mockResolvedValue({
      data: { success: true, message: 'ok', data: [] },
    })

    await expect(getWorkspaceTags('ws-1')).resolves.toEqual([])
  })
})

describe('buildCreateTagPayload', () => {
  it('creates a Tag child under the workspace with HAS_TAGS relation', () => {
    expect(buildCreateTagPayload('Urgent', 'ws-1')).toEqual({
      children: [
        {
          relation: 'HAS_TAGS',
          label: 'Tag',
          props: { name: 'Urgent', workspaceId: 'ws-1' },
        },
      ],
    })
  })

  it('does not add any Task -> Tag relation (single workspace child only)', () => {
    const payload = buildCreateTagPayload('Bug', 'ws-1')
    expect(payload.children).toHaveLength(1)
    expect(payload.children[0].relation).toBe('HAS_TAGS')
    expect(payload.children[0].label).toBe('Tag')
  })

  it('matches the shared buildCreateChildPayload contract', () => {
    expect(buildCreateTagPayload('Bug', 'ws-1')).toEqual(
      buildCreateChildPayload('ws-1', {
        relation: 'HAS_TAGS',
        label: 'Tag',
        props: { name: 'Bug', workspaceId: 'ws-1' },
      }),
    )
  })
})

describe('createWorkspaceTag', () => {
  it('PATCHes the parent workspace with the HAS_TAGS Tag child', async () => {
    mockPatch.mockResolvedValue({
      data: { success: true, message: 'created', data: undefined },
    })

    await createWorkspaceTag('Urgent', 'ws-1')

    expect(mockPatch).toHaveBeenCalledWith(
      '/graphs/ws-1',
      buildCreateTagPayload('Urgent', 'ws-1'),
    )
  })

  it('throws when creation fails', async () => {
    mockPatch.mockResolvedValue({
      data: { success: false, message: 'boom', data: undefined },
    })

    await expect(createWorkspaceTag('Urgent', 'ws-1')).rejects.toThrow('boom')
  })
})