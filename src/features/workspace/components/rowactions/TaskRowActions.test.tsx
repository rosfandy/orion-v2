import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskRowActions } from './TaskRowActions'
import { deleteTask } from './deleteTask'

vi.mock('./deleteTask', () => ({
  deleteTask: vi.fn(),
}))

const mockDeleteTask = vi.mocked(deleteTask)

function openMenu() {
  return userEvent.click(screen.getByRole('button', { name: 'More actions' }))
}

describe('TaskRowActions - Delete menu', () => {
  beforeEach(() => {
    mockDeleteTask.mockReset()
    mockDeleteTask.mockResolvedValue(undefined)
  })

  it('renders a More actions dropdown with a Delete item', async () => {
    render(<TaskRowActions taskId="task-42" />)
    expect(
      screen.getByRole('button', { name: 'More actions' }),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'More actions' }))

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: /delete/i }),
    ).toBeInTheDocument()
  })
})

describe('TaskRowActions - task id target', () => {
  beforeEach(() => {
    mockDeleteTask.mockReset()
    mockDeleteTask.mockResolvedValue(undefined)
  })

  it('carries the given taskId on the Delete item', async () => {
    render(<TaskRowActions taskId="task-target-7" />)
    await openMenu()

    expect(screen.getByRole('menuitem', { name: /delete/i })).toHaveAttribute(
      'data-task-id',
      'task-target-7',
    )
  })

  it('calls the supplied onDelete with the given taskId', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)
    render(<TaskRowActions taskId="task-target-9" onDelete={onDelete} />)
    await openMenu()
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }))

    expect(onDelete).toHaveBeenCalledExactlyOnceWith('task-target-9')
  })

  it('defaults to the existing deleteTask (deleteGraph) targeted at the given taskId', async () => {
    render(<TaskRowActions taskId="task-default-3" />)
    await openMenu()
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }))

    expect(mockDeleteTask).toHaveBeenCalledExactlyOnceWith('task-default-3')
  })
})

describe('TaskRowActions - delete success path', () => {
  it('invokes onDeleteSuccess with the taskId after a resolved delete', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)
    const onDeleteSuccess = vi.fn()
    render(
      <TaskRowActions
        taskId="task-ok-1"
        onDelete={onDelete}
        onDeleteSuccess={onDeleteSuccess}
      />,
    )
    await openMenu()
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }))

    await waitFor(() => {
      expect(onDeleteSuccess).toHaveBeenCalledExactlyOnceWith('task-ok-1')
    })
  })

  it('closes the menu after a successful delete', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)
    render(<TaskRowActions taskId="task-ok-2" onDelete={onDelete} />)
    await openMenu()
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }))

    await waitFor(() => {
      expect(
        screen.queryByRole('menuitem', { name: /delete/i }),
      ).not.toBeInTheDocument()
    })
  })
})

describe('TaskRowActions - delete failure path', () => {
  it('invokes onDeleteError with the taskId and the error when delete rejects', async () => {
    const onDeleteError = vi.fn()
    render(
      <TaskRowActions
        taskId="task-fail-1"
        onDelete={vi.fn().mockRejectedValue(new Error('boom'))}
        onDeleteError={onDeleteError}
      />,
    )
    await openMenu()
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }))

    await waitFor(() => {
      expect(onDeleteError).toHaveBeenCalledExactlyOnceWith(
        'task-fail-1',
        expect.any(Error),
      )
    })
  })

  it('keeps the menu open and shows the error message on failure', async () => {
    render(
      <TaskRowActions
        taskId="task-fail-2"
        onDelete={vi.fn().mockRejectedValue(new Error('boom'))}
      />,
    )
    await openMenu()
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('boom')
    expect(
      screen.getByRole('menuitem', { name: /delete/i }),
    ).toBeInTheDocument()
  })
})
