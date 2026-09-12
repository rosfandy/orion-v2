import { serializeDueDate } from './dueDate'
import type { DueDateValue } from './dueDate'

export function assigneesToPatch(assignees: string[]): { assignee: string } {
  return { assignee: assignees.join(',') }
}

export function dueDateToPatch(
  dueDate: DueDateValue | null,
): { duedate: string } {
  return { duedate: serializeDueDate(dueDate) }
}

export function buildTaskUpdates(input: {
  assignees?: string[]
  dueDate?: DueDateValue | null
}): { assignee?: string; duedate?: string } {
  const patch: { assignee?: string; duedate?: string } = {}
  if (input.assignees !== undefined) patch.assignee = input.assignees.join(',')
  if (input.dueDate !== undefined) patch.duedate = serializeDueDate(input.dueDate)
  return patch
}