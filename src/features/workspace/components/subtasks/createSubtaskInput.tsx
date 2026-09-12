import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { cn } from '#/lib/cn'
import { handleSubtaskDraft } from './createSubtask'
import type { CreateSubtaskResult } from './createSubtask'
import { useCreateSubtask } from './useCreateSubtask'

export type CreateSubtaskProps = {
  parentTaskId: string
  placeholder?: string
  autoFocus?: boolean
  className?: string
  onCreated?: (result: CreateSubtaskResult) => void
  onCancelled?: () => void
}

/**
 * Inline input for creating a subtask under a parent task.
 * - Empty submission and Escape-cancel never touch the graph.
 * - Successful saves fire onCreated with the child graph id so the UI layer
 *   (U9) can sync rendered rows without reloading the whole tree.
 */
export function CreateSubtask({
  parentTaskId,
  placeholder = 'Subtask name',
  autoFocus = true,
  className,
  onCreated,
  onCancelled,
}: CreateSubtaskProps) {
  const { create, isCreating } = useCreateSubtask()
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  async function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      const decision = handleSubtaskDraft(name, 'submit')
      if (!decision.save) return
      try {
        const result = await create({ parentTaskId, name: decision.name })
        setName('')
        onCreated?.(result)
      } catch {
        // Surface failures via the hook error state; keep the draft editable.
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setName('')
      onCancelled?.()
    }
  }

  return (
    <div className={cn('inline-flex items-center', className)}>
      <input
        ref={inputRef}
        data-purpose="create-subtask-input"
        data-parent-task-id={parentTaskId}
        type="text"
        value={name}
        disabled={isCreating}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-48 rounded border border-gray-200 bg-white px-2 py-1 text-[13px] text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
      />
    </div>
  )
}