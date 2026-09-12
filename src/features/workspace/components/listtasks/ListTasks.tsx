import { useEffect, useRef, useState } from 'react'
import {
  MdAdd,
  MdChevronRight,
  MdEdit,
  MdMoreHoriz,
  MdOutlineLabel,
  MdRadioButtonUnchecked,
} from 'react-icons/md'
import {
  AssigneesDropdown,
  DueDateDropdown,
  PriorityDropdown,
  StatusDropdown,
} from '#/features/workspaces/components/dropdown'
import { formatDueDate } from '#/features/workspace/components/tasks/taskSerialization'
import type {
  DueDateValue,
  Priority,
  TaskStatus,
} from '#/features/workspaces/components/dropdown'

export type ListTask = {
  id: string
  name: string
  status?: TaskStatus | null
  assignees?: string[]
  dueDate?: DueDateValue | null
  priority?: Priority | null
  comments?: number
  expandable?: boolean
  selected?: boolean
}

export type ListTasksProps = {
  listId: string
  title?: string
  tasks?: ListTask[]
  onAddTask?: (name: string) => void | Promise<void>
  onUpdateTask?: (taskId: string, changedProps: Record<string, unknown>) => void | Promise<void>
}

const defaultTasks: ListTask[] = [
  {
    id: 'task-1',
    name: 'Task 1',
    status: 'todo',
    assignees: ['bagus-ridho'],
    dueDate: null,
    priority: null,
  },
  {
    id: 'task-2',
    name: 'Task 2',
    status: 'in-progress',
    priority: 'urgent',
    assignees: ['super'],
    expandable: true,
    selected: true,
  },
  {
    id: 'task-3',
    name: 'Task 3',
    status: 'done',
    dueDate: { start: 'Aug 19 07:00', end: 'Aug 19 17:00' },
  },
]

export function ListTasks({
  listId,
  title,
  tasks = defaultTasks,
  onAddTask,
  onUpdateTask,
}: ListTasksProps) {
  const [rows, setRows] = useState<ListTask[]>(tasks)
  const [adding, setAdding] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setRows(tasks)
  }, [tasks])

  useEffect(() => {
    if (adding) nameInputRef.current?.focus()
  }, [adding])

  useEffect(() => {
    if (editingId) editInputRef.current?.focus()
  }, [editingId])

  function updateTask(id: string, patch: Partial<ListTask>) {
    setRows((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    )
  }

  function startEdit(task: ListTask) {
    setEditingId(task.id)
    setEditName(task.name)
  }

  function commitEdit() {
    if (!editingId) return
    const newName = editName.trim()
    if (newName && newName !== rows.find((t) => t.id === editingId)?.name) {
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
                <th
                  className="w-[8%] py-2 pl-2 pr-4 text-right font-medium"
                  scope="col"
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-800 transition-colors hover:text-gray-900"
                  >
                    <MdAdd className="size-3.5 text-gray-900" />
                    <span>Add</span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {rows.map((task) => (
                <tr
                  key={task.id}
                  className="group transition-colors hover:bg-gray-50/70"
                >
                  <td className="whitespace-nowrap py-1.5 pl-8 pr-3 font-normal text-gray-800">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title="Mark complete"
                        className="text-gray-400 transition-colors hover:text-gray-600 focus:outline-none"
                      >
                        <MdRadioButtonUnchecked
                          className="size-3.5"
                          strokeDasharray="3 3"
                        />
                      </button>
                      {editingId === task.id ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              commitEdit()
                            } else if (e.key === 'Escape') {
                              cancelEdit()
                            }
                          }}
                          className="w-48 rounded border border-gray-200 bg-white px-2 py-0.5 text-[13px] text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="font-medium text-gray-800">
                          {task.name}
                        </span>
                      )}
                      <div className="ml-3 inline-flex items-center gap-1 text-gray-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                        {task.expandable ? (
                          <button
                            type="button"
                            title="Expand subtasks"
                            className="p-0.5 transition-colors hover:text-gray-600"
                          >
                            <MdChevronRight className="size-2.5 fill-current" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          title="Add subtask"
                          className="rounded p-0.5 transition-colors hover:bg-gray-200/70 hover:text-gray-600"
                        >
                          <MdAdd className="size-3" />
                        </button>
                        <button
                          type="button"
                          title="Add tag"
                          className="rounded p-0.5 transition-colors hover:bg-gray-200/70 hover:text-gray-600"
                        >
                          <MdOutlineLabel className="size-3" />
                        </button>
                        <button
                          type="button"
                          title="Edit name"
                          onClick={() => startEdit(task)}
                          className="rounded p-0.5 transition-colors hover:bg-gray-200/70 hover:text-gray-600"
                        >
                          <MdEdit className="size-3" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <AssigneesDropdown
                      value={task.assignees ?? []}
                      onChange={(assignees) => {
                        updateTask(task.id, { assignees })
                        void onUpdateTask?.(task.id, {
                          assignee: assignees.join(','),
                        })
                      }}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5">
                    <DueDateDropdown
                      value={task.dueDate ?? null}
                      onChange={(dueDate) => {
                        updateTask(task.id, { dueDate })
                        void onUpdateTask?.(task.id, {
                          duedate: formatDueDate(dueDate),
                        })
                      }}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5">
                    <PriorityDropdown
                      value={task.priority ?? null}
                      onChange={(priority) => {
                        updateTask(task.id, { priority })
                        void onUpdateTask?.(task.id, { priority: priority ?? '' })
                      }}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5">
                    <StatusDropdown
                      value={task.status ?? null}
                      onChange={(status) => {
                        updateTask(task.id, { status })
                        void onUpdateTask?.(task.id, { status: status ?? '' })
                      }}
                    />
                  </td>

                  <td className="whitespace-nowrap py-1.5 pl-2 pr-4 text-right">
                    <button
                      type="button"
                      title="More options"
                      className="inline-flex h-5 w-6 items-center justify-center rounded text-gray-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100 hover:bg-gray-200/70 hover:text-gray-600"
                    >
                      <MdMoreHoriz className="size-3.5" />
                    </button>
                  </td>
                </tr>
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
