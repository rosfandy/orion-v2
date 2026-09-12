import { Fragment, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import {
  MdAdd,
  MdChevronRight,
  MdEdit,
  MdOutlineLabel,
} from 'react-icons/md'
import { LuGitBranch } from 'react-icons/lu'
import {
  PriorityDropdown,
  StatusDropdown,
} from '#/features/workspaces/components/dropdown'
import type {
  DueDateValue,
  Priority,
  TaskStatus,
} from '#/features/workspaces/components/dropdown'
import {
  AssigneeDropdown,
  assigneesToPatch,
  dueDateToPatch,
  DueDatePicker,
  useWorkspaceMembers,
} from '#/features/workspace/components/listtasks/u5'
import type { MemberOption } from '#/features/workspace/components/listtasks/u5'
import { TaskRowActions } from '#/features/workspace/components/rowactions'
import { CreateSubtask } from '#/features/workspace/components/subtasks'
import { serializeTagIds, TagDropdown } from '#/features/workspace/components/tags'

export type ListTask = {
  id: string
  name: string
  status?: TaskStatus | null
  assignees?: string[]
  dueDate?: DueDateValue | null
  priority?: Priority | null
  tags?: string[]
  subtasks?: ListTask[]
  parentId?: string
  comments?: number
  expandable?: boolean
  selected?: boolean
}

export type ListTasksProps = {
  listId: string
  title?: string
  tasks?: ListTask[]
  workspaceId?: string
  onAddTask?: (name: string) => void | Promise<void>
  onUpdateTask?: (
    taskId: string,
    changedProps: Record<string, unknown>,
  ) => void | Promise<void>
  onDeleteTask?: (taskId: string) => Promise<unknown> | void
  onSubtaskCreated?: (parentTaskId: string) => void | Promise<void>
}

const skeletonRows = ['skeleton-1', 'skeleton-2', 'skeleton-3']

type TaskRowProps = {
  task: ListTask
  depth: number
  workspaceId?: string
  members: MemberOption[]
  editingId: string | null
  editName: string
  editInputRef: RefObject<HTMLInputElement | null>
  subtaskFor: string | null
  onEditNameChange: (name: string) => void
  onCommitEdit: () => void
  onCancelEdit: () => void
  onStartEdit: (task: ListTask) => void
  onPatchTask: (taskId: string, patch: Partial<ListTask>) => void
  onUpdateTask?: ListTasksProps['onUpdateTask']
  onDeleteTask?: ListTasksProps['onDeleteTask']
  onDeleteSuccess: (taskId: string) => void
  onOpenSubtaskDraft: (taskId: string) => void
  onCloseSubtaskDraft: () => void
  onSubtaskCreated: (parentTaskId: string) => void
  expandedIds: Set<string>
  onToggleCollapse: (taskId: string) => void
}

// ponytail: module-level on purpose — a nested component identity would
// remount every render and kill dropdown open state. Subtask trees render
// recursively under their parent row.
function TaskRow({
  task,
  depth,
  workspaceId,
  members,
  editingId,
  editName,
  editInputRef,
  subtaskFor,
  onEditNameChange,
  onCommitEdit,
  onCancelEdit,
  onStartEdit,
  onPatchTask,
  onUpdateTask,
  onDeleteTask,
  onDeleteSuccess,
  onOpenSubtaskDraft,
  onCloseSubtaskDraft,
  onSubtaskCreated,
  expandedIds,
  onToggleCollapse,
}: TaskRowProps) {
  const rowProps = {
    task,
    depth,
    workspaceId,
    members,
    editingId,
    editName,
    editInputRef,
    subtaskFor,
    onEditNameChange,
    onCommitEdit,
    onCancelEdit,
    onStartEdit,
    onPatchTask,
    onUpdateTask,
    onDeleteTask,
    onDeleteSuccess,
    onOpenSubtaskDraft,
    onCloseSubtaskDraft,
    onSubtaskCreated,
    expandedIds,
    onToggleCollapse,
  }
  const hasSubtasks = Boolean(task.subtasks?.length)
  const expanded = expandedIds.has(task.id)
  return (
    <Fragment>
      <tr
        data-task-id={task.id}
        {...(depth > 0 ? { 'data-parent-task-id': task.parentId } : {})}
        className="group transition-colors hover:bg-gray-50/70"
      >
        <td className="whitespace-nowrap py-1.5 pr-3 font-normal text-gray-800" style={{ 
          borderLeftWidth: depth > 0 ? '2px' : '0',
          borderColor: '#e5e7eb', 
          borderStyle: 'solid',
          paddingTop: undefined,
        }}>
          <div className="flex items-center gap-4" style={{ paddingLeft: `${1 + depth * 0.5}rem` }}>
            {hasSubtasks ? (
              <button
                type="button"
                title={expanded ? 'Collapse subtasks' : 'Expand subtasks'}
                aria-expanded={expanded}
                onClick={() => onToggleCollapse(task.id)}
                className="text-gray-400 transition-colors hover:text-gray-600 focus:outline-none"
              >
                <MdChevronRight
                  className={`size-3.5 fill-current transition-transform ${expanded ? 'rotate-90' : ''}`}
                />
              </button>
            ) : (
              <span className="size-3.5 shrink-0" aria-hidden />
            )}
            {editingId === task.id ? (
              <input
                ref={editInputRef}
                type="text"
                value={editName}
                onChange={(e) => onEditNameChange(e.target.value)}
                onBlur={onCommitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onCommitEdit()
                  } else if (e.key === 'Escape') {
                    onCancelEdit()
                  }
                }}
                className="w-48 rounded border border-gray-200 bg-white px-2 py-0.5 text-[13px] text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <>
                <span className="font-medium text-gray-800">{task.name}</span>
                {task.subtasks?.length ? (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <LuGitBranch className="size-3" />
                    {task.subtasks.length}
                  </span>
                ) : null}
              </>
            )}
            <div className="inline-flex items-center gap-1 ml-auto text-gray-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
              {subtaskFor === task.id ? (
                <span className="rounded bg-gray-200/70 p-0.5">
                  <MdAdd className="size-3" />
                </span>
              ) : (
                <button
                  type="button"
                  title="Add subtask"
                  onClick={() => onOpenSubtaskDraft(task.id)}
                  className="rounded p-0.5 transition-colors hover:bg-gray-200/70 hover:text-gray-600"
                >
                  <MdAdd className="size-3" />
                </button>
              )}
              <TagDropdown
                workspaceId={workspaceId ?? ''}
                selectedTagIds={task.tags ?? []}
                onChange={(tagIds) => {
                  onPatchTask(task.id, { tags: tagIds })
                  void onUpdateTask?.(task.id, {
                    tags: serializeTagIds(tagIds),
                  })
                }}
              />
              <button
                type="button"
                title="Edit name"
                onClick={() => onStartEdit(task)}
                className="rounded p-0.5 transition-colors hover:bg-gray-200/70 hover:text-gray-600"
              >
                <MdEdit className="size-3" />
              </button>
            </div>
          </div>
        </td>
        <td className="px-3 py-1.5">
          <AssigneeDropdown
            value={task.assignees ?? []}
            members={members}
            onChange={(assignees) => {
              onPatchTask(task.id, { assignees })
              void onUpdateTask?.(task.id, assigneesToPatch(assignees))
            }}
          />
        </td>
        <td className="whitespace-nowrap px-3 py-1.5">
          <DueDatePicker
            value={task.dueDate ?? null}
            onChange={(dueDate) => {
              onPatchTask(task.id, { dueDate })
              void onUpdateTask?.(task.id, dueDateToPatch(dueDate))
            }}
          />
        </td>
        <td className="whitespace-nowrap px-3 py-1.5">
          <PriorityDropdown
            value={task.priority ?? null}
            onChange={(priority) => {
              onPatchTask(task.id, { priority })
              void onUpdateTask?.(task.id, { priority: priority ?? '' })
            }}
          />
        </td>
        <td className="whitespace-nowrap px-3 py-1.5">
          <StatusDropdown
            value={task.status ?? null}
            onChange={(status) => {
              onPatchTask(task.id, { status })
              void onUpdateTask?.(task.id, { status: status ?? '' })
            }}
          />
        </td>

        <td className="whitespace-nowrap py-1.5 pl-2 pr-4 text-right">
          <TaskRowActions
            taskId={task.id}
            onDelete={onDeleteTask}
            onDeleteSuccess={onDeleteSuccess}
          />
        </td>
      </tr>
      {subtaskFor === task.id ? (
        <tr
          key={`${task.id}-subtask-draft`}
          data-task-id={`${task.id}-subtask-draft`}
          data-parent-task-id={task.id}
        >
          <td
            colSpan={6}
            className="whitespace-nowrap py-1.5 pr-3"
            style={{ paddingLeft: `${(depth + 1) * 32 + 8}px` }}
            onBlur={(e) => {
              // ponytail: dismiss the draft row when the empty input loses focus
              const value =
                e.currentTarget.querySelector('input')?.value ?? ''
              if (!value.trim()) onCloseSubtaskDraft()
            }}
          >
            <CreateSubtask
              parentTaskId={task.id}
              onCreated={() => onSubtaskCreated(task.id)}
              onCancelled={onCloseSubtaskDraft}
            />
          </td>
        </tr>
      ) : null}
      {hasSubtasks && expanded
        ? task.subtasks?.map((subtask) => (
            <TaskRow
              key={subtask.id}
              {...rowProps}
              task={{ ...subtask, parentId: task.id }}
              depth={depth + 1}
            />
          ))
        : null}
    </Fragment>
  )
}

export function ListTasks({
  listId,
  title,
  tasks,
  workspaceId,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onSubtaskCreated,
}: ListTasksProps) {
  const [rows, setRows] = useState<ListTask[]>(tasks ?? [])
  const [adding, setAdding] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [subtaskFor, setSubtaskFor] = useState<string | null>(null)
  // ponytail: subtasks start closed; expansion is opt-in per row
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const nameInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const { members } = useWorkspaceMembers(workspaceId)

  useEffect(() => {
    setRows(tasks ?? [])
  }, [tasks])

  useEffect(() => {
    if (adding) nameInputRef.current?.focus()
  }, [adding])

  useEffect(() => {
    if (editingId) editInputRef.current?.focus()
  }, [editingId])

  function updateTask(id: string, patch: Partial<ListTask>) {
    // ponytail: patch nested subtask rows too, not just top-level rows
    const patchTree = (tasks: ListTask[]): ListTask[] =>
      tasks.map((task) =>
        task.id === id
          ? { ...task, ...patch }
          : task.subtasks
            ? { ...task, subtasks: patchTree(task.subtasks) }
            : task,
      )
    setRows((prev) => patchTree(prev))
  }

  function findTask(tasks: ListTask[], id: string): ListTask | undefined {
    for (const task of tasks) {
      if (task.id === id) return task
      const nested = task.subtasks ? findTask(task.subtasks, id) : undefined
      if (nested) return nested
    }
    return undefined
  }

  function startEdit(task: ListTask) {
    setEditingId(task.id)
    setEditName(task.name)
  }

  function commitEdit() {
    if (!editingId) return
    const newName = editName.trim()
    if (newName && newName !== findTask(rows, editingId)?.name) {
      updateTask(editingId, { name: newName })
      void onUpdateTask?.(editingId, { name: newName })
    }
    setEditingId(null)
    setEditName('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
  }

  function toggleCollapse(taskId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  function handleDeleted(taskId: string) {
    const removeFromTree = (tasks: ListTask[]): ListTask[] =>
      tasks
        .filter((task) => task.id !== taskId)
        .map((task) =>
          task.subtasks ? { ...task, subtasks: removeFromTree(task.subtasks) } : task,
        )
    setRows((prev) => removeFromTree(prev))
  }

  function handleSubtaskCreated(parentTaskId: string) {
    setRows((prev) =>
      prev.map((task) =>
        task.id === parentTaskId ? { ...task, expandable: true } : task,
      ),
    )
    // ponytail: reveal the new child even though subtasks default to closed
    setExpandedIds((prev) => new Set(prev).add(parentTaskId))
    setSubtaskFor(null)
    void onSubtaskCreated?.(parentTaskId)
  }

  return (
    <section
      className="mx-auto w-full max-w-5xl"
      aria-label={title ?? 'List tasks'}
    >
      {title ? (
        <h1 className="mb-3 text-2xl font-bold text-on-surface">{title}</h1>
      ) : null}
      <div data-purpose="task-table-wrapper" data-list-id={listId}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse select-none text-left">
            <thead>
              <tr className="border-b border-gray-200/80 text-[11px] font-semibold tracking-wide text-gray-500">
                <th
                  className="w-[34%] py-2 pl-8 pr-3 font-medium text-gray-500"
                  scope="col"
                >
                  Name
                </th>
                <th
                  className="w-[12%] px-3 py-2 font-medium text-gray-400"
                  scope="col"
                >
                  Assignee
                </th>
                <th
                  className="w-[12%] px-3 py-2 font-medium text-gray-500"
                  scope="col"
                >
                  Due date
                </th>
                <th
                  className="w-[10%] px-3 py-2 font-medium text-gray-500"
                  scope="col"
                >
                  Priority
                </th>
                <th
                  className="w-[14%] px-3 py-2 font-medium text-gray-500"
                  scope="col"
                >
                  Status
                </th>
                <th className="w-[8%] py-2 pl-2 pr-4" scope="col" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {tasks === undefined
                ? skeletonRows.map((id) => (
                    <tr key={id} data-task-id={id} aria-hidden="true">
                      <td className="py-1.5 pl-8 pr-3">
                        <div className="h-4 w-48 animate-pulse rounded bg-gray-200/70" />
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="h-4 w-16 animate-pulse rounded bg-gray-200/70" />
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200/70" />
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="h-4 w-14 animate-pulse rounded bg-gray-200/70" />
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200/70" />
                      </td>
                      <td />
                    </tr>
                  ))
                : rows.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      depth={0}
                      workspaceId={workspaceId}
                      members={members}
                      editingId={editingId}
                      editName={editName}
                      editInputRef={editInputRef}
                      subtaskFor={subtaskFor}
                      onEditNameChange={setEditName}
                      onCommitEdit={commitEdit}
                      onCancelEdit={cancelEdit}
                      onStartEdit={startEdit}
                      onPatchTask={updateTask}
                      onUpdateTask={onUpdateTask}
                      onDeleteTask={onDeleteTask}
                      onDeleteSuccess={handleDeleted}
                      onOpenSubtaskDraft={setSubtaskFor}
                      onCloseSubtaskDraft={() => setSubtaskFor(null)}
                      onSubtaskCreated={handleSubtaskCreated}
                      expandedIds={expandedIds}
                      onToggleCollapse={toggleCollapse}
                    />
                  ))}

              {adding ? (
                <tr data-purpose="task-row" data-task-id={draftName ? `draft-${Date.now()}` : 'draft'}>
                  <td className="whitespace-nowrap px-3 py-1.5">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && draftName.trim()) {
                          void onAddTask?.(draftName.trim())?.then(() => {
                            setAdding(false)
                            setDraftName('')
                          })
                        } else if (e.key === 'Escape') {
                          setAdding(false)
                          setDraftName('')
                        }
                      }}
                      placeholder="Task name"
                      className="w-48 rounded border border-gray-200 bg-white px-2 py-1 text-[13px] text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td />
                  <td />
                  <td />
                  <td />
                  <td className="whitespace-nowrap px-3 py-1.5">
                    <span className="mr-1 inline-flex h-4 w-4 items-center justify-center">
                      <MdOutlineLabel className="size-3.5 text-gray-300" />
                    </span>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div
          className="border-t border-gray-100 py-2 pl-8"
          data-purpose="bottom-add-task"
        >
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 text-xs font-normal text-gray-400 transition-colors hover:text-gray-600"
          >
            <MdAdd className="size-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>
    </section>
  )
}