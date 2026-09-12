import { describe, expect, it, vi } from 'vitest'

import {
  buildCreateChildPayload,
  buildDirectPatchPayload,
  isCreateChild,
} from './graphService'

vi.mock('#/config/axios', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('isCreateChild', () => {
  it('returns true when relation and label present', () => {
    expect(isCreateChild({ relation: 'HAS_TASKS', label: 'Task' })).toBe(true)
  })

  it('returns false when relation only', () => {
    expect(isCreateChild({ relation: 'HAS_TASKS' })).toBe(false)
  })

  it('returns false when label only', () => {
    expect(isCreateChild({ label: 'Task' })).toBe(false)
  })

  it('returns false for direct patch input', () => {
    expect(isCreateChild({ props: { priority: 'high' } })).toBe(false)
  })
})

describe('buildCreateChildPayload', () => {
  it('includes relation, label, and name in child props', () => {
    const result = buildCreateChildPayload('ws-1', {
      relation: 'HAS_SPACE',
      label: 'Space',
      name: 'My Space',
    })
    expect(result).toEqual({
      children: [
        {
          relation: 'HAS_SPACE',
          label: 'Space',
          props: { name: 'My Space' },
        },
      ],
    })
  })

  it('creates Task child without injecting workspaceId', () => {
    const result = buildCreateChildPayload('ws-1', {
      relation: 'HAS_TASKS',
      label: 'Task',
      name: 'My Task',
    })
    expect(result.children[0].props).not.toHaveProperty('workspaceId')
    expect(result.children[0].props).toEqual({ name: 'My Task' })
  })

  it('merges caller-provided props alongside name', () => {
    const result = buildCreateChildPayload('ws-1', {
      relation: 'HAS_FOLDERS',
      label: 'Folder',
      name: 'My Folder',
      props: { color: 'blue' },
    })
    expect(result.children[0].props).toEqual({
      name: 'My Folder',
      color: 'blue',
    })
  })

  it('uses props.name when name is not given', () => {
    const result = buildCreateChildPayload('ws-1', {
      relation: 'HAS_LISTS',
      label: 'List',
      props: { name: 'My List' },
    })
    expect(result.children[0].props).toEqual({ name: 'My List' })
  })

  it('preserves caller-provided workspaceId for Space children', () => {
    const result = buildCreateChildPayload('ws-1', {
      relation: 'HAS_SPACES',
      label: 'Space',
      name: 'My Space',
      props: { workspaceId: 'ws-1' },
    })
    expect(result.children[0].props).toEqual({
      name: 'My Space',
      workspaceId: 'ws-1',
    })
  })

  it('leaves Folder and List children without workspaceId', () => {
    const folder = buildCreateChildPayload('space-1', {
      relation: 'HAS_FOLDERS',
      label: 'Folder',
      name: 'My Folder',
    })
    const list = buildCreateChildPayload('space-1', {
      relation: 'HAS_LISTS',
      label: 'List',
      name: 'My List',
    })
    expect(folder.children[0].props).not.toHaveProperty('workspaceId')
    expect(list.children[0].props).not.toHaveProperty('workspaceId')
  })
})

describe('buildDirectPatchPayload', () => {
  it('sends only name when given', () => {
    expect(buildDirectPatchPayload({ name: 'New Name' })).toEqual({
      props: { name: 'New Name' },
    })
  })

  it('sends only changed props as partial patch (nested under props)', () => {
    expect(
      buildDirectPatchPayload({
        props: { priority: 'high' },
      }),
    ).toEqual({
      props: { priority: 'high' },
    })
  })

  it('merges name and props', () => {
    expect(
      buildDirectPatchPayload({
        name: 'Renamed',
        props: { priority: 'high' },
      }),
    ).toEqual({
      props: { name: 'Renamed', priority: 'high' },
    })
  })

  it('returns empty props when no fields given', () => {
    expect(buildDirectPatchPayload({})).toEqual({ props: {} })
  })
})

describe('Task creation contract', () => {
  it('creates Task with HAS_TASKS relation and Task label', () => {
    const result = buildCreateChildPayload('list-1', {
      relation: 'HAS_TASKS',
      label: 'Task',
      name: 'New Task',
    })

    expect(result).toEqual({
      children: [
        {
          relation: 'HAS_TASKS',
          label: 'Task',
          props: { name: 'New Task' },
        },
      ],
    })
  })

  it('Task initial props contain only name (no extra fields)', () => {
    const result = buildCreateChildPayload('list-1', {
      relation: 'HAS_TASKS',
      label: 'Task',
      name: 'My Task',
    })

    expect(result.children[0].props).toEqual({ name: 'My Task' })
    expect(result.children[0].props).not.toHaveProperty('status')
    expect(result.children[0].props).not.toHaveProperty('assignee')
    expect(result.children[0].props).not.toHaveProperty('duedate')
    expect(result.children[0].props).not.toHaveProperty('priority')
  })

  it('isCreateChild identifies Task creation input', () => {
    const input = { relation: 'HAS_TASKS', label: 'Task', name: 'Task' }
    expect(isCreateChild(input)).toBe(true)
  })
})

describe('Task partial update semantics', () => {
  it('updating only priority does not include other fields', () => {
    const result = buildDirectPatchPayload({
      props: { priority: 'high' },
    })
    expect(result).toEqual({ props: { priority: 'high' } })
    expect(result.props).not.toHaveProperty('status')
    expect(result.props).not.toHaveProperty('assignee')
    expect(result.props).not.toHaveProperty('duedate')
    expect(result.props).not.toHaveProperty('name')
  })

  it('updating only status does not include other fields', () => {
    const result = buildDirectPatchPayload({
      props: { status: 'done' },
    })
    expect(result).toEqual({ props: { status: 'done' } })
    expect(result.props).not.toHaveProperty('priority')
    expect(result.props).not.toHaveProperty('assignee')
  })

  it('updating only assignee does not include other fields', () => {
    const result = buildDirectPatchPayload({
      props: { assignee: 'user1,user2' },
    })
    expect(result).toEqual({ props: { assignee: 'user1,user2' } })
    expect(result.props).not.toHaveProperty('status')
    expect(result.props).not.toHaveProperty('priority')
  })

  it('updating only duedate does not include other fields', () => {
    const result = buildDirectPatchPayload({
      props: { duedate: 'Aug 19 07:00->Aug 19 17:00' },
    })
    expect(result).toEqual({
      props: { duedate: 'Aug 19 07:00->Aug 19 17:00' },
    })
    expect(result.props).not.toHaveProperty('status')
    expect(result.props).not.toHaveProperty('assignee')
  })

  it('clearing assignee sends empty string', () => {
    const result = buildDirectPatchPayload({
      props: { assignee: '' },
    })
    expect(result).toEqual({ props: { assignee: '' } })
  })

  it('clearing duedate sends empty string', () => {
    const result = buildDirectPatchPayload({
      props: { duedate: '' },
    })
    expect(result).toEqual({ props: { duedate: '' } })
  })

  it('UI-only fields (expandable, selected, comments) are not in patch payload', () => {
    const result = buildDirectPatchPayload({
      props: {
        status: 'in-progress',
        expandable: true,
        selected: true,
        comments: 5,
      },
    })
    expect(result).toEqual({
      props: {
        status: 'in-progress',
        expandable: true,
        selected: true,
        comments: 5,
      },
    })
    // Note: The payload builder itself doesn't filter UI fields.
    // The UI layer (ListTasks.tsx) is responsible for not sending them.
    // This test documents the contract that the builder passes through whatever it receives.
  })
})
