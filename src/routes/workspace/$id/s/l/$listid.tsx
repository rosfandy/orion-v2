import { useParams } from 'react-router-dom'
import type {
  GraphRelation,
  GraphSpace,
} from '#/features/graphs/services/graphService'
import { useGraph, useGraphById } from '#/features/graphs/hooks/useGraph'
import { ListTasks } from '#/features/workspace/components/listtasks'
import type { ListTask } from '#/features/workspace/components/listtasks'
import {
  coerceAssignees,
  coerceDueDate,
  coercePriority,
  coerceStatus,
  graphToTasks,
} from '#/features/workspace/components/tasks/taskSerialization'
import { parseTagIds } from '#/features/workspace/components/tags'

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

// U8 stores tags as a JSON string on the task meta; parse it once at the
// graph boundary so rows always receive a deduped id array. HAS_SUBTASK
// relations are mapped recursively into nested subtask rows.
function toSubtask(relation: GraphRelation, parentId: string): ListTask {
  const { id, name, assignee, duedate, priority, status, tags } = relation.data
  return {
    id,
    name,
    status: coerceStatus(status),
    assignees: coerceAssignees(assignee),
    dueDate: coerceDueDate(duedate),
    priority: coercePriority(priority),
    tags: parseTagIds(tags),
    parentId,
    expandable: Boolean(relation.HAS_SUBTASK?.length),
    subtasks: relation.HAS_SUBTASK?.map((child) => toSubtask(child, id)),
  }
}

function tasksWithTags(node: GraphSpace): ListTask[] {
  return graphToTasks(node).map((task) => {
    const relation = node.HAS_TASKS?.find(
      (candidate) => candidate.data.id === task.id,
    )
    return {
      ...task,
      tags: parseTagIds(relation?.data.tags),
      expandable: Boolean(task.expandable || relation?.HAS_SUBTASK?.length),
      subtasks: relation?.HAS_SUBTASK?.map((child) =>
        toSubtask(child, task.id),
      ),
    }
  })
}

export default function ListTasksPage() {
  const { id = '', listid = '' } = useParams<{ id: string; listid: string }>()
  const {
    data: graph,
    update,
    remove,
    refetch: refetchGraph,
  } = useGraph(id)
  const { data: listNode, refetch: refetchListNode } = useGraphById(listid)
  const listName = graph ? findListName(graph, listid) : undefined

  return (
    <div className="p-6 pt-8">
      <ListTasks
        listId={listid}
        title={listName ?? 'Tasks'}
        workspaceId={id}
        tasks={listNode ? tasksWithTags(listNode) : undefined}
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
        onDeleteTask={(taskId) => remove(taskId)}
        onSubtaskCreated={async () => {
          await Promise.all([refetchGraph(), refetchListNode()])
        }}
      />
    </div>
  )
}
