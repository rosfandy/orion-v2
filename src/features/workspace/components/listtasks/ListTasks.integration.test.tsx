import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ListTasks } from './ListTasks'
import type { ListTask, ListTasksProps } from './ListTasks'
import { apiClient } from '#/config/axios'

vi.mock('#/config/axios', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
  },
}))

const getMock = vi.mocked(apiClient.get)
const patchMock = vi.mocked(apiClient.patch)
const deleteMock = vi.mocked(apiClient.delete)
const requestMock = vi.mocked(apiClient.request)

const workspaceResponse = {
  success: true,
  data: {
    id: 'ws-1',
    graph_id: 'g-ws-1',
    name: 'Team',
    members: [
      {
        id: 'm1',
        workspaceId: 'ws-1',
        userId: 'u1',
        role: 'member',
        user: { id: 'u1', name: 'Alice', email: 'alice@x.com' },
      },
      {
        id: 'm2',
        workspaceId: 'ws-1',
        userId: 'u2',
        role: 'member',
        user: { id: 'u2', name: 'Bob Reyes' },
      },
    ],
  },
  message: 'ok',
}

const tagsResponse = {
  success: true,
  data: [
    { meta: { id: 'tag-a', name: 'Urgent' } },
    { meta: { id: 'tag-b', name: 'Client' } },
  ],
  message: 'ok',
}

const sampleTasks: ListTask[] = [
  {
    id: 'task-1',
    name: 'Alpha',
    status: 'todo',
    assignees: ['u1'],
    dueDate: { start: 'Sep 12 09:00', end: 'Sep 12 17:00' },
    priority: 'low',
  },
  { id: 'task-2', name: 'Beta', status: 'in-progress', tags: ['tag-a'] },
]

function setupApi() {
  getMock.mockReset()
  patchMock.mockReset()
  deleteMock.mockReset()
  requestMock.mockReset()
  getMock.mockImplementation(async (url: string) => {
    if (url === '/graphs/label/tag') return { data: tagsResponse }
    return { data: { success: true, data: [], message: 'ok' } }
  })
  // workspaceService reads workspaces through apiClient.request
  requestMock.mockImplementation(async (config: { url?: string }) => {
    if (config.url === '/workspaces/ws-1') return { data: workspaceResponse }
    return { data: { success: true, data: [], message: 'ok' } }
  })
  patchMock.mockResolvedValue({
    data: { success: true, data: { id: 'subtask-created' }, message: 'ok' },
  })
  deleteMock.mockResolvedValue({
    data: { success: true, data: null, message: 'ok' },
  })
}

function renderListTasks(props: Partial<ListTasksProps> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const callbacks = {
    onAddTask: vi.fn(),
    onUpdateTask: vi.fn(),
    onDeleteTask: vi.fn().mockResolvedValue(undefined),
    onSubtaskCreated: vi.fn(),
  }
  const view = render(
    <QueryClientProvider client={queryClient}>
      <ListTasks
        listId="list-1"
        workspaceId="ws-1"
        tasks={sampleTasks}
        {...callbacks}
        {...props}
      />
    </QueryClientProvider>,
  )
  return { ...view, callbacks }
}

function getRows() {
  return {
    task1: document.querySelector(
      'tr[data-task-id="task-1"]',
    ) as HTMLElement,
    task2: document.querySelector(
      'tr[data-task-id="task-2"]',
    ) as HTMLElement,
  }
}

describe('ListTasks — U9 integration of U5-U8', () => {
  beforeEach(setupApi)

  it('removes the add-column affordance while keeping the bottom Add Task row', () => {
    renderListTasks()
    expect(
      screen.getByRole('button', { name: 'Add Task' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument()
  })

  it('patches only the priority prop of the changed task', async () => {
    const { callbacks } = renderListTasks()
    const { task1 } = getRows()
    await userEvent.click(
      within(task1).getByRole('button', { name: 'Set priority' }),
    )
    await userEvent.click(await screen.findByRole('menuitem', { name: /high/i }))
    expect(callbacks.onUpdateTask).toHaveBeenCalledExactlyOnceWith('task-1', {
      priority: 'high',
    })
  })

  it('patches only the status prop of the changed task', async () => {
    const { callbacks } = renderListTasks()
    const { task2 } = getRows()
    await userEvent.click(
      within(task2).getByRole('button', { name: 'Set status' }),
    )
    await userEvent.click(
      await screen.findByRole('button', { name: /done/i }),
    )
    expect(callbacks.onUpdateTask).toHaveBeenCalledExactlyOnceWith('task-2', {
      status: 'done',
    })
  })

  it('renames only the edited task', async () => {
    const { callbacks } = renderListTasks()
    const { task1 } = getRows()
    await userEvent.click(
      within(task1).getByRole('button', { name: 'Edit name' }),
    )
    const input = within(task1).getByDisplayValue('Alpha')
    await userEvent.clear(input)
    await userEvent.type(input, 'Alpha 2{Enter}')
    await waitFor(() => {
      expect(callbacks.onUpdateTask).toHaveBeenCalledWith('task-1', {
        name: 'Alpha 2',
      })
    })
  })

  it('patches assignees for the target task id only', async () => {
    const { callbacks } = renderListTasks()
    const { task1 } = getRows()
    await userEvent.click(
      within(task1).getByRole('button', { name: 'Set assignees' }),
    )
    await userEvent.click(
      await screen.findByRole('option', { name: /bob reyes/i }),
    )
    expect(callbacks.onUpdateTask).toHaveBeenCalledExactlyOnceWith('task-1', {
      assignee: 'u1,u2',
    })
  })

  it('clears due date by patching only the duedate prop', async () => {
    const { callbacks } = renderListTasks()
    const { task1 } = getRows()
    await userEvent.click(
      within(task1).getByRole('button', { name: 'Set due date' }),
    )
    await userEvent.click(await screen.findByRole('button', { name: 'Clear' }))
    expect(callbacks.onUpdateTask).toHaveBeenCalledExactlyOnceWith('task-1', {
      duedate: '',
    })
  })

  it('toggles tags and sends only the deduped JSON tags prop for the task', async () => {
    const { callbacks } = renderListTasks()
    const { task2 } = getRows()
    await userEvent.click(
      within(task2).getByRole('button', { name: 'Set tags' }),
    )
    await userEvent.click(await screen.findByRole('button', { name: 'Client' }))
    expect(callbacks.onUpdateTask).toHaveBeenCalledExactlyOnceWith('task-2', {
      tags: '["tag-a","tag-b"]',
    })
  })

  it('never sends an accidental full-task patch across mixed feature edits', async () => {
    const { callbacks } = renderListTasks()
    const { task1, task2 } = getRows()

    await userEvent.click(
      within(task1).getByRole('button', { name: 'Set priority' }),
    )
    await userEvent.click(await screen.findByRole('menuitem', { name: /high/i }))
    await userEvent.click(
      within(task2).getByRole('button', { name: 'Set status' }),
    )
    await userEvent.click(
      await screen.findByRole('button', { name: /done/i }),
    )

    expect(callbacks.onUpdateTask).toHaveBeenCalledTimes(2)
    expect(callbacks.onUpdateTask.mock.calls[0]).toEqual([
      'task-1',
      { priority: 'high' },
    ])
    expect(callbacks.onUpdateTask.mock.calls[1]).toEqual([
      'task-2',
      { status: 'done' },
    ])
    for (const [, changedProps] of callbacks.onUpdateTask.mock.calls) {
      expect(Object.keys(changedProps)).toHaveLength(1)
    }
  })

  it('deletes the target task id, never the list id', async () => {
    const { container, callbacks } = renderListTasks()
    const { task2 } = getRows()
    await userEvent.click(
      within(task2).getByRole('button', { name: 'More actions' }),
    )
    await userEvent.click(await screen.findByRole('menuitem', { name: /delete/i }))

    await waitFor(() => {
      expect(callbacks.onDeleteTask).toHaveBeenCalledExactlyOnceWith('task-2')
    })
    expect(callbacks.onDeleteTask.mock.calls[0][0]).not.toBe('list-1')
    await waitFor(() => {
      expect(container.querySelector('tr[data-task-id="task-2"]')).toBeNull()
    })
  })

  it('creates a subtask under the parent task id with HAS_SUBTASK / Task only', async () => {
    const { callbacks } = renderListTasks()
    const { task2 } = getRows()
    await userEvent.click(
      within(task2).getByRole('button', { name: 'Add subtask' }),
    )
    const input = await screen.findByPlaceholderText('Subtask name')
    expect(input).toHaveAttribute('data-parent-task-id', 'task-2')

    // draft row renders below the parent row, indented
    const draftRow = input.closest('tr')
    expect(draftRow).toHaveAttribute('data-parent-task-id', 'task-2')
    const parentRow = document.querySelector('tr[data-task-id="task-2"]')
    expect(parentRow?.nextElementSibling).toBe(draftRow)

    await userEvent.type(input, 'Sub Beta{Enter}')

    await waitFor(() => {
      expect(patchMock).toHaveBeenCalledTimes(1)
      expect(patchMock).toHaveBeenCalledWith('/graphs/task-2', {
        children: [
          {
            relation: 'HAS_SUBTASK',
            label: 'Task',
            props: { name: 'Sub Beta' },
          },
        ],
      })
    })
    expect(callbacks.onSubtaskCreated).toHaveBeenCalledExactlyOnceWith('task-2')
  })

  it('removes the empty subtask draft row when the input loses focus', async () => {
    renderListTasks()
    const { task1 } = getRows()
    await userEvent.click(
      within(task1).getByRole('button', { name: 'Add subtask' }),
    )
    const input = await screen.findByPlaceholderText('Subtask name')
    expect(input.closest('tr')).toHaveAttribute(
      'data-parent-task-id',
      'task-1',
    )

    await userEvent.click(document.querySelector('h1, section') as Element)
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText('Subtask name'),
      ).not.toBeInTheDocument()
    })
    expect(patchMock).not.toHaveBeenCalled()
  })

  it('renders skeleton rows instead of dummy data while tasks are loading', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <ListTasks listId="list-1" workspaceId="ws-1" tasks={undefined} />
      </QueryClientProvider>,
    )
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument()
    expect(
      document.querySelectorAll('tr[data-task-id^="skeleton-"]'),
    ).toHaveLength(3)
  })

  it('toggles subtask visibility when the chevron is clicked', async () => {
    renderListTasks({
      tasks: [
        {
          id: 'task-1',
          name: 'Alpha',
          status: 'todo',
          subtasks: [
            { id: 'sub-1', name: 'Sub Alpha', status: 'todo', parentId: 'task-1' },
          ],
        },
        { id: 'task-2', name: 'Beta', status: 'in-progress' },
      ],
    })

    const parentRow = document.querySelector('tr[data-task-id="task-1"]')
    expect(parentRow).toBeInTheDocument()
    // subtasks default to closed
    expect(
      document.querySelector('tr[data-task-id="sub-1"]'),
    ).not.toBeInTheDocument()
    // chevron replaces the circle on the left of the parent name
    const chevron = within(parentRow as HTMLElement).getByRole('button', {
      name: 'Expand subtasks',
    })
    expect(chevron).toBeInTheDocument()
    expect(
      within(parentRow as HTMLElement).queryByTitle('Mark complete'),
    ).not.toBeInTheDocument()
    // chevron floats over the gutter so it never shifts the name
    expect(chevron.closest('span')?.className).toContain('absolute')

    await userEvent.click(chevron)
    expect(
      document.querySelector('tr[data-task-id="sub-1"]'),
    ).toBeInTheDocument()
    expect(
      within(parentRow as HTMLElement).getByRole('button', {
        name: 'Collapse subtasks',
      }),
    ).toBeInTheDocument()

    await userEvent.click(
      within(parentRow as HTMLElement).getByRole('button', {
        name: 'Collapse subtasks',
      }),
    )
    expect(
      document.querySelector('tr[data-task-id="sub-1"]'),
    ).not.toBeInTheDocument()

    // tasks without subtasks render no chevron and no circle
    const plainRow = document.querySelector(
      'tr[data-task-id="task-2"]',
    ) as HTMLElement
    expect(plainRow).toBeInTheDocument()
    expect(
      within(plainRow).queryByRole('button', { name: /subtasks/i }),
    ).not.toBeInTheDocument()
  })

  it('renders existing HAS_SUBTASK rows nested under their parent task', async () => {
    const { callbacks } = renderListTasks({
      tasks: [
        {
          id: 'task-1',
          name: 'Alpha',
          status: 'todo',
          subtasks: [
            { id: 'sub-1', name: 'Sub Alpha', status: 'todo', parentId: 'task-1' },
          ],
        },
        { id: 'task-2', name: 'Beta', status: 'in-progress' },
      ],
    })

    const parentRow = document.querySelector('tr[data-task-id="task-1"]')
    expect(parentRow).toBeInTheDocument()
    // closed by default — expand first
    await userEvent.click(
      within(parentRow as HTMLElement).getByRole('button', {
        name: 'Expand subtasks',
      }),
    )
    const subRow = document.querySelector('tr[data-task-id="sub-1"]')
    expect(parentRow).toBeInTheDocument()
    expect(subRow).toBeInTheDocument()
    expect(subRow).toHaveAttribute('data-parent-task-id', 'task-1')
    expect(parentRow?.nextElementSibling).toBe(subRow)
    expect(within(subRow as HTMLElement).getByText('Sub Alpha')).toBeInTheDocument()

    // nested row actions still target the subtask id, not the parent or list
    await userEvent.click(
      within(subRow as HTMLElement).getByRole('button', { name: 'Set priority' }),
    )
    await userEvent.click(await screen.findByRole('menuitem', { name: /high/i }))
    expect(callbacks.onUpdateTask).toHaveBeenCalledExactlyOnceWith('sub-1', {
      priority: 'high',
    })
  })
})