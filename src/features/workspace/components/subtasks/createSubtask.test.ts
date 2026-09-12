import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '#/config/axios'
import {
  createSubtask,
  extractChildId,
  handleSubtaskDraft,
  SUBTASK_LABEL,
  SUBTASK_RELATION,
} from './createSubtask'

vi.mock('#/config/axios', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const patchMock = apiClient.patch as unknown as ReturnType<typeof vi.fn>
const createdChild = (data: unknown) => ({
  data: { success: true, data, message: '' },
})

describe('createSubtask - parentTaskId as parent graph', () => {
  beforeEach(() => {
    patchMock.mockReset()
    patchMock.mockResolvedValue(createdChild({ id: 'subtask-1' }))
  })

  it('sends the child to the parent task graph id', async () => {
    await createSubtask({ parentTaskId: 'task-parent', name: 'Sub A' })

    expect(patchMock).toHaveBeenCalledTimes(1)
    expect(patchMock).toHaveBeenCalledWith('/graphs/task-parent', {
      children: [
        { relation: SUBTASK_RELATION, label: SUBTASK_LABEL, props: { name: 'Sub A' } },
      ],
    })
  })

  it('uses HAS_SUBTASK relation and Task label', async () => {
    await createSubtask({ parentTaskId: 'task-parent', name: 'Sub A' })

    const payload = patchMock.mock.calls[0][1] as {
      children: [{ relation: string; label: string }]
    }
    expect(payload.children[0].relation).toBe(SUBTASK_RELATION)
    expect(payload.children[0].relation).toBe('HAS_SUBTASK')
    expect(payload.children[0].label).toBe(SUBTASK_LABEL)
    expect(payload.children[0].label).toBe('Task')
  })

  it('persists name-only props (no status/assignee/duedate/priority)', async () => {
    await createSubtask({ parentTaskId: 'task-parent', name: 'Sub A' })

    const props = (patchMock.mock.calls[0][1] as { children: [{ props: Record<string, unknown> }] })
      .children[0].props
    expect(props).toEqual({ name: 'Sub A' })
    expect(props).not.toHaveProperty('status')
    expect(props).not.toHaveProperty('assignee')
    expect(props).not.toHaveProperty('duedate')
    expect(props).not.toHaveProperty('priority')
  })

  it('trims whitespace around the submitted name', async () => {
    await createSubtask({ parentTaskId: 'task-parent', name: '  Sub A  ' })

    const props = (patchMock.mock.calls[0][1] as { children: [{ props: Record<string, unknown> }] })
      .children[0].props
    expect(props).toEqual({ name: 'Sub A' })
  })

  it('returns the created child graph id on success', async () => {
    patchMock.mockResolvedValue(createdChild({ id: 'subtask-77' }))

    const result = await createSubtask({ parentTaskId: 'task-parent', name: 'Sub A' })

    expect(result).toEqual({
      id: 'subtask-77',
      parentTaskId: 'task-parent',
      name: 'Sub A',
    })
  })

  it('does not call the graph when the name is empty', async () => {
    patchMock.mockReset()
    await expect(
      createSubtask({ parentTaskId: 'task-parent', name: '   ' }),
    ).rejects.toThrow('Subtask name must not be empty')
    expect(patchMock).not.toHaveBeenCalled()
  })

  it('does not call the graph when parentTaskId is missing', async () => {
    patchMock.mockReset()
    await expect(
      createSubtask({ parentTaskId: '   ', name: 'Sub A' }),
    ).rejects.toThrow('parentTaskId is required')
    expect(patchMock).not.toHaveBeenCalled()
  })

  it('throws when the server response carries no child id', async () => {
    patchMock.mockResolvedValue(createdChild({}))

    await expect(
      createSubtask({ parentTaskId: 'task-parent', name: 'Sub A' }),
    ).rejects.toThrow('Created subtask id was not returned')
    expect(patchMock).toHaveBeenCalledTimes(1)
  })
})

describe('handleSubtaskDraft - empty/cancel never save', () => {
  it('does not save a whitespace-only submit', () => {
    expect(handleSubtaskDraft('   ', 'submit')).toEqual({
      save: false,
      reason: 'empty',
    })
  })

  it('does not save on cancel', () => {
    expect(handleSubtaskDraft('Sub A', 'cancel')).toEqual({
      save: false,
      reason: 'cancelled',
    })
  })

  it('saves a trimmed name on a valid submit', () => {
    expect(handleSubtaskDraft('  Sub A  ', 'submit')).toEqual({
      save: true,
      name: 'Sub A',
    })
  })
})

describe('extractChildId - success result id', () => {
  it('reads a top-level id', () => {
    expect(extractChildId({ id: 'subtask-1' })).toBe('subtask-1')
  })

  it('reads a nested data.id', () => {
    expect(extractChildId({ data: { id: 'subtask-2' } })).toBe('subtask-2')
  })

  it('reads meta.id', () => {
    expect(extractChildId({ meta: { id: 'subtask-3' } })).toBe('subtask-3')
  })

  it('reads children[0].id', () => {
    expect(extractChildId({ children: [{ id: 'subtask-4' }] })).toBe('subtask-4')
  })

  it('returns undefined for unknown or empty shapes', () => {
    expect(extractChildId(null)).toBeUndefined()
    expect(extractChildId('nope')).toBeUndefined()
    expect(extractChildId({})).toBeUndefined()
    expect(extractChildId({ children: [] })).toBeUndefined()
  })
})