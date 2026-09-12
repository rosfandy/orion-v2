import { updateGraph } from '#/features/graphs/services/graphService'

export const SUBTASK_RELATION = 'HAS_SUBTASK' as const
export const SUBTASK_LABEL = 'Task' as const

export type CreateSubtaskInput = {
  parentTaskId: string
  name: string
}

export type CreateSubtaskResult = {
  id: string
  parentTaskId: string
  name: string
}

export type SubtaskDraftDecision =
  | { save: true; name: string }
  | { save: false; reason: 'empty' | 'cancelled' }

/**
 * Resolve a raw draft (name + event) into a save decision.
 * Empty submissions and explicit cancels never produce a graph call.
 */
export function handleSubtaskDraft(
  rawName: string,
  event: 'submit' | 'cancel',
): SubtaskDraftDecision {
  if (event === 'cancel') return { save: false, reason: 'cancelled' }
  const name = rawName.trim()
  if (!name) return { save: false, reason: 'empty' }
  return { save: true, name }
}

/**
 * Pull the created child graph id out of the generic create-child response.
 * The PATCH /graphs/:id payload is opaque (`data: unknown`), so a few common
 * server shapes are tolerated. Returns undefined when no id is present.
 */
export function extractChildId(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const record = data as Record<string, unknown>

  if (typeof record.id === 'string' && record.id) return record.id

  const nestedData = record.data
  if (nestedData && typeof nestedData === 'object') {
    const id = extractChildId(nestedData)
    if (id) return id
  }

  const meta = record.meta
  if (meta && typeof meta === 'object') {
    const id = (meta as Record<string, unknown>).id
    if (typeof id === 'string' && id) return id
  }

  if (Array.isArray(record.children) && record.children.length > 0) {
    const child = record.children[0] as Record<string, unknown>
    if (typeof child.id === 'string' && child.id) return child.id
    const childMeta = child.meta
    if (childMeta && typeof childMeta === 'object') {
      const id = (childMeta as Record<string, unknown>).id
      if (typeof id === 'string' && id) return id
    }
  }

  return undefined
}

/**
 * Create a subtask under an existing parent task by reusing the generic
 * create-child mutation. The parent graph node is `parentTaskId`, the child is
 * persisted as relation HAS_SUBTASK / label Task with name-only props.
 */
export async function createSubtask(
  input: CreateSubtaskInput,
): Promise<CreateSubtaskResult> {
  const parentTaskId = input.parentTaskId.trim()
  const name = input.name.trim()

  if (!parentTaskId) {
    throw new Error('parentTaskId is required to create a subtask')
  }
  if (!name) {
    throw new Error('Subtask name must not be empty')
  }

  const data = await updateGraph(parentTaskId, {
    relation: SUBTASK_RELATION,
    label: SUBTASK_LABEL,
    props: { name },
  })

  const id = extractChildId(data)
  if (!id) {
    throw new Error('Created subtask id was not returned by the server')
  }

  return { id, parentTaskId, name }
}