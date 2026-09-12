import { createFileRoute } from '@tanstack/react-router'
import type {
  GraphRelation,
  GraphSpace,
} from '#/features/graphs/services/graphService'
import { useGraph, useGraphById } from '#/features/graphs/hooks/useGraph'
import { ListTasks } from '#/features/workspace/components/listtasks'
import { graphToTasks } from '#/features/workspace/components/tasks/taskSerialization'

export const Route = createFileRoute('/workspace/$id/s/l/$listid')({
  component: ListTasksPage,
})

function findListNameInRelations(
  node: GraphRelation,
  target: string,
): string | undefined {
  for (const relation of node.HAS_LISTS ?? []) {
    if (relation.data.id === target) return relation.data.name
  }
  for (const relation of node.HAS_FOLDERS ?? []) {
    const name = findListNameInRelations(relation, target)
    if (name) return name
  }
  return undefined
}

function findListName(spaces: GraphSpace[], target: string) {
  for (const space of spaces) {
    for (const relation of space.HAS_LISTS ?? []) {
      if (relation.data.id === target) return relation.data.name
    }
    for (const relation of space.HAS_FOLDERS ?? []) {
      const name = findListNameInRelations(relation, target)
      if (name) return name
    }
  }
  return undefined
}

function ListTasksPage() {
  const { id, listid } = Route.useParams()
  const { data: graph, update } = useGraph(id)
  const { data: listNode } = useGraphById(listid)
  const listName = graph ? findListName(graph, listid) : undefined

  return (
    <div className="p-6 pt-8">
      <ListTasks
        listId={listid}
        title={listName ?? 'Tasks'}
        tasks={listNode ? graphToTasks(listNode) : undefined}
        onAddTask={async (name) => {
          await update({
            graphId: listid,
            relation: 'HAS_TASKS',
            label: 'Task',
            props: { name },
          })
        }}
        onUpdateTask={async (taskId, changedProps) => {
          await update({ graphId: taskId, props: changedProps })
        }}
      />
    </div>
  )
}
