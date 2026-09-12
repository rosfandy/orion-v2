import { deleteGraph } from '#/features/graphs/services/graphService'

export type DeleteTaskFn = (taskId: string) => Promise<unknown> | void

export function deleteTask(taskId: string) {
  return deleteGraph(taskId)
}
