import type { GraphNode } from '#/features/graphs/services/graphService'
import type { ListTask } from '#/features/workspace/components/listtasks'
import type {
  DueDateValue,
  Priority,
  TaskStatus,
} from '#/features/workspaces/components/dropdown'

export const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done']
export const PRIORITIES: Priority[] = ['urgent', 'high', 'medium', 'low']

export function coerceStatus(status?: string): TaskStatus | null {
  if (status && STATUSES.includes(status as TaskStatus)) {
    return status as TaskStatus
  }
  return null
}

export function coercePriority(priority?: string): Priority | null {
  if (priority && PRIORITIES.includes(priority as Priority)) {
    return priority as Priority
  }
  return null
}

export function coerceDueDate(dueDate?: string): DueDateValue | null {
  if (!dueDate) return null
  const [start = '', end = start] = dueDate.split('->')
  return { start: start.trim(), end: end.trim() }
}

export function coerceAssignees(assignee?: string): string[] {
  return assignee
    ? assignee
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    : []
}

export function formatDueDate(dueDate: DueDateValue | null): string {
  if (!dueDate) return ''
  return `${dueDate.start}->${dueDate.end}`
}

export function graphToTasks(node: GraphNode): ListTask[] {
  return (node.HAS_TASKS ?? []).map((relation) => {
    const { id, name, assignee, duedate, priority, status } = relation.data
    return {
      id,
      name,
      status: coerceStatus(status),
      assignees: coerceAssignees(assignee),
      dueDate: coerceDueDate(duedate),
      priority: coercePriority(priority),
      expandable: Boolean(
        relation.HAS_TASKS?.length ||
          relation.HAS_DOCUMENTS?.length ||
          relation.HAS_LISTS?.length ||
          relation.HAS_FOLDERS?.length,
      ),
    }
  })
}
