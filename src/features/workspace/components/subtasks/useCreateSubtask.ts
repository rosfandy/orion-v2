import { useMutation } from '@tanstack/react-query'
import { createSubtask } from './createSubtask'
import type { CreateSubtaskInput } from './createSubtask'

/**
 * Mutation wrapper around the generic create-child path for subtasks.
 * Keeps the U7 module reactive to react-query (pending/error state) while
 * leaving the graph write contract owned by the shared service layer.
 */
export function useCreateSubtask() {
  const mutation = useMutation({
    mutationFn: (input: CreateSubtaskInput) => createSubtask(input),
  })

  return {
    create: mutation.mutateAsync,
    isCreating: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  }
}