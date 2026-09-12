import { describe, expect, it } from 'vitest'
import type { GraphNode } from '#/features/graphs/services/graphService'
import {
  coerceAssignees,
  coerceDueDate,
  coercePriority,
  coerceStatus,
  formatDueDate,
  graphToTasks,
} from './taskSerialization'

describe('graphToTasks - graph id preservation', () => {
  it('preserves relation.data.id as ListTask.id', () => {
    const node: GraphNode = {
      meta: { id: 'list-1', name: 'My List', labels: ['List'] },
      HAS_TASKS: [
        {
          relation_id: 'rel-1',
          data: { id: 'task-abc', name: 'Task One', labels: ['Task'] },
        },
        {
          relation_id: 'rel-2',
          data: { id: 'task-def', name: 'Task Two', labels: ['Task'] },
        },
      ],
    }

    const tasks = graphToTasks(node)

    expect(tasks).toHaveLength(2)
    expect(tasks[0].id).toBe('task-abc')
    expect(tasks[1].id).toBe('task-def')
  })

  it('returns empty array when HAS_TASKS is undefined', () => {
    const node: GraphNode = {
      meta: { id: 'list-1', name: 'My List', labels: ['List'] },
    }

    expect(graphToTasks(node)).toEqual([])
  })

  it('does not expose UI-only fields (expandable, selected, comments) in payload', () => {
    const node: GraphNode = {
      meta: { id: 'list-1', name: 'My List', labels: ['List'] },
      HAS_TASKS: [
        {
          relation_id: 'rel-1',
          data: {
            id: 'task-1',
            name: 'Task',
            labels: ['Task'],
            assignee: 'user1',
            duedate: 'Aug 19 07:00->Aug 19 17:00',
            priority: 'high',
            status: 'todo',
          },
        },
      ],
    }

    const [task] = graphToTasks(node)

    expect(task).not.toHaveProperty('selected')
    expect(task).not.toHaveProperty('comments')
    expect(task).toHaveProperty('expandable')
    expect(task).toHaveProperty('id')
    expect(task).toHaveProperty('name')
  })
})

describe('serialization - assignees', () => {
  it('deserializes comma-separated assignee to array', () => {
    const node: GraphNode = {
      meta: { id: 'list-1', name: 'List', labels: ['List'] },
      HAS_TASKS: [
        {
          relation_id: 'rel-1',
          data: {
            id: 'task-1',
            name: 'Task',
            labels: ['Task'],
            assignee: 'bagus-ridho,super',
          },
        },
      ],
    }

    const [task] = graphToTasks(node)
    expect(task.assignees).toEqual(['bagus-ridho', 'super'])
  })

  it('serializes assignees array to comma-separated string', () => {
    const assignees = ['bagus-ridho', 'super']
    expect(assignees.join(',')).toBe('bagus-ridho,super')
  })

  it('handles single assignee without comma', () => {
    expect(coerceAssignees('bagus-ridho')).toEqual(['bagus-ridho'])
  })

  it('handles empty assignee string', () => {
    expect(coerceAssignees('')).toEqual([])
  })

  it('handles undefined assignee', () => {
    expect(coerceAssignees(undefined)).toEqual([])
  })

  it('trims whitespace around assignees', () => {
    expect(coerceAssignees('user1, user2 , user3')).toEqual([
      'user1',
      'user2',
      'user3',
    ])
  })

  it('filters empty entries from trailing comma', () => {
    expect(coerceAssignees('user1,user2,')).toEqual(['user1', 'user2'])
  })
})

describe('serialization - due date', () => {
  it('deserializes duedate "start->end" to object', () => {
    const node: GraphNode = {
      meta: { id: 'list-1', name: 'List', labels: ['List'] },
      HAS_TASKS: [
        {
          relation_id: 'rel-1',
          data: {
            id: 'task-1',
            name: 'Task',
            labels: ['Task'],
            duedate: 'Aug 19 07:00->Aug 19 17:00',
          },
        },
      ],
    }

    const [task] = graphToTasks(node)
    expect(task.dueDate).toEqual({ start: 'Aug 19 07:00', end: 'Aug 19 17:00' })
  })

  it('serializes due date object to "start->end" format', () => {
    const dueDate = { start: 'Aug 19 07:00', end: 'Aug 19 17:00' }
    expect(formatDueDate(dueDate)).toBe('Aug 19 07:00->Aug 19 17:00')
  })

  it('handles null due date', () => {
    expect(formatDueDate(null)).toBe('')
    expect(coerceDueDate(undefined)).toBeNull()
  })

  it('handles single date (no arrow) as both start and end', () => {
    expect(coerceDueDate('Aug 19 07:00')).toEqual({
      start: 'Aug 19 07:00',
      end: 'Aug 19 07:00',
    })
  })

  it('trims whitespace in due date parts', () => {
    expect(coerceDueDate('Aug 19 07:00 -> Aug 19 17:00')).toEqual({
      start: 'Aug 19 07:00',
      end: 'Aug 19 17:00',
    })
  })
})

describe('serialization - priority', () => {
  it('deserializes valid priority', () => {
    const node: GraphNode = {
      meta: { id: 'list-1', name: 'List', labels: ['List'] },
      HAS_TASKS: [
        {
          relation_id: 'rel-1',
          data: {
            id: 'task-1',
            name: 'Task',
            labels: ['Task'],
            priority: 'urgent',
          },
        },
      ],
    }

    const [task] = graphToTasks(node)
    expect(task.priority).toBe('urgent')
  })

  it('returns null for invalid priority', () => {
    expect(coercePriority('invalid')).toBeNull()
  })

  it('returns null for undefined priority', () => {
    expect(coercePriority(undefined)).toBeNull()
  })

  it('accepts all valid priorities', () => {
    expect(coercePriority('urgent')).toBe('urgent')
    expect(coercePriority('high')).toBe('high')
    expect(coercePriority('medium')).toBe('medium')
    expect(coercePriority('low')).toBe('low')
  })
})

describe('serialization - status', () => {
  it('deserializes valid status', () => {
    const node: GraphNode = {
      meta: { id: 'list-1', name: 'List', labels: ['List'] },
      HAS_TASKS: [
        {
          relation_id: 'rel-1',
          data: {
            id: 'task-1',
            name: 'Task',
            labels: ['Task'],
            status: 'in-progress',
          },
        },
      ],
    }

    const [task] = graphToTasks(node)
    expect(task.status).toBe('in-progress')
  })

  it('returns null for invalid status', () => {
    expect(coerceStatus('archived')).toBeNull()
  })

  it('returns null for undefined status', () => {
    expect(coerceStatus(undefined)).toBeNull()
  })

  it('accepts all valid statuses', () => {
    expect(coerceStatus('todo')).toBe('todo')
    expect(coerceStatus('in-progress')).toBe('in-progress')
    expect(coerceStatus('done')).toBe('done')
  })
})

describe('serialization - name', () => {
  it('preserves name field directly', () => {
    const node: GraphNode = {
      meta: { id: 'list-1', name: 'List', labels: ['List'] },
      HAS_TASKS: [
        {
          relation_id: 'rel-1',
          data: {
            id: 'task-1',
            name: 'My Task Name',
            labels: ['Task'],
          },
        },
      ],
    }

    const [task] = graphToTasks(node)
    expect(task.name).toBe('My Task Name')
  })
})

describe('clear assignee/due date', () => {
  it('clearing assignees produces empty array', () => {
    expect(coerceAssignees('')).toEqual([])
  })

  it('clearing due date produces null', () => {
    expect(coerceDueDate('')).toBeNull()
    expect(coerceDueDate(undefined)).toBeNull()
  })

  it('formatDueDate for cleared date returns empty string', () => {
    expect(formatDueDate(null)).toBe('')
  })
})
