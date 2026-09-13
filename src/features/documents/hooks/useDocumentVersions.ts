import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import {
  createManualSnapshot,
  deleteDocumentVersion,
  listDocumentVersions,
  type DocumentVersion,
} from '#/features/documents/services/documentVersionService'

export const documentVersionsQueryKey = (graph_id: string) =>
  ['documents', graph_id, 'versions'] as const satisfies QueryKey

export type UseDocumentVersionsReturn = {
  versions: DocumentVersion[]
  isLoading: boolean
  error: unknown
  refresh: () => Promise<any>
  createManual: (note?: string) => Promise<DocumentVersion>
  deleteVersion: (version_id: string) => Promise<void>
  isCreating: boolean
  isDeleting: boolean
}

export function useDocumentVersions(graph_id: string): UseDocumentVersionsReturn {
  const queryClient = useQueryClient()
  const key = documentVersionsQueryKey(graph_id)

  const query = useQuery({
    queryKey: key,
    queryFn: () => listDocumentVersions(graph_id),
    staleTime: 5_000,
  })

  const createMutation = useMutation({
    mutationFn: ({ note }: { note?: string } = {}) => createManualSnapshot({ graph_id, note }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ version_id }: { version_id: string }) =>
      deleteDocumentVersion(graph_id, version_id),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(key, (old: DocumentVersion[] | undefined) => {
        if (!old) return old
        return old.filter((v) => v.id !== variables.version_id)
      })
      void queryClient.invalidateQueries({ queryKey: key })
    },
  })

  return {
    versions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refresh: query.refetch as () => Promise<any>,
    createManual: (note?: string) => createMutation.mutateAsync({ note }),
    deleteVersion: (version_id: string) => deleteMutation.mutateAsync({ version_id }),
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
