import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getGraph,
  getGraphById,
  deleteGraph,
  updateGraph,
} from '#/features/graphs/services/graphService'

export function useGraph(id: string) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['graph', id],
    queryFn: () => getGraph(id),
    enabled: Boolean(id),
  })
  const updateMutation = useMutation({
    mutationFn: (input: {
      graphId?: string
      name?: string
      relation?: string
      label?: string
      props?: Record<string, unknown>
    }) => updateGraph(input.graphId ?? id, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['graph'] }),
        queryClient.refetchQueries({ queryKey: ['graph-node'] }),
      ])
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteGraph,
    onSuccess: async (_, graphId) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['graph'] }),
        queryClient.refetchQueries({ queryKey: ['graph-node'] }),
      ])
      queryClient.removeQueries({ queryKey: ['graph-node', graphId] })
    },
  })

  return {
    ...query,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    remove: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}

export function useGraphById(id?: string) {
  return useQuery({
    queryKey: ['graph-node', id],
    queryFn: () => getGraphById(id as string),
    enabled: Boolean(id),
  })
}
