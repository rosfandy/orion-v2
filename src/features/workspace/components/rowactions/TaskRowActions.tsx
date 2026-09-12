import { useState } from 'react'
import { MdDeleteOutline, MdMoreHoriz } from 'react-icons/md'
import { DropdownPopover } from '#/features/workspaces/components/dropdown'
import { cn } from '#/lib/cn'
import { deleteTask } from './deleteTask'
import type { DeleteTaskFn } from './deleteTask'

export type TaskRowActionsProps = {
  taskId: string
  onDelete?: DeleteTaskFn
  onDeleteSuccess?: (taskId: string) => void
  onDeleteError?: (taskId: string, error: unknown) => void
  onOpenChange?: (open: boolean) => void
  ariaLabel?: string
  triggerClassName?: string
  contentClassName?: string
}

const defaultTriggerClassName =
  'inline-flex h-5 w-6 items-center justify-center rounded text-gray-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100 hover:bg-gray-200/70 hover:text-gray-600'

export function TaskRowActions({
  taskId,
  onDelete = deleteTask,
  onDeleteSuccess,
  onDeleteError,
  onOpenChange,
  ariaLabel = 'More actions',
  triggerClassName,
  contentClassName,
}: TaskRowActionsProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) setError(null)
    setOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  async function handleDelete() {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      await onDelete(taskId)
      onDeleteSuccess?.(taskId)
      setOpen(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to delete task'
      setError(message)
      onDeleteError?.(taskId, err)
    } finally {
      setPending(false)
    }
  }

  return (
    <DropdownPopover
      ariaLabel={ariaLabel}
      open={open}
      onOpenChange={handleOpenChange}
      triggerClassName={cn(defaultTriggerClassName, triggerClassName)}
      contentClassName={cn(
        'w-48 overflow-hidden rounded-lg border border-slate-200/80 bg-white text-sm shadow-lg',
        contentClassName,
      )}
      trigger={<MdMoreHoriz className="size-3.5" />}
    >
      <header className="border-b border-slate-100 px-3 py-2">
        <span className="block select-none text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
          More actions
        </span>
      </header>
      <div className="py-1" role="menu">
        <button
          type="button"
          role="menuitem"
          data-task-id={taskId}
          disabled={pending}
          onClick={() => void handleDelete()}
          className="flex w-full items-center px-3 py-1.5 text-left transition-colors hover:bg-red-50"
        >
          <MdDeleteOutline className="mr-2.5 size-3.5 shrink-0 text-red-500" />
          <span className="text-[13px] font-medium leading-none text-red-600">
            {pending ? 'Deleting…' : 'Delete'}
          </span>
        </button>
      </div>
      {error ? (
        <p
          role="alert"
          className="border-t border-slate-100 px-3 py-2 text-[11px] text-red-600"
        >
          {error}
        </p>
      ) : null}
    </DropdownPopover>
  )
}
