import { useCallback, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getDocument, putDocument } from './documentService'
import type { CurrentDocument } from './documentService'

export type SaveState = 'saved' | 'dirty' | 'saving' | 'save-failed'

export interface UseDocumentAutosaveOptions {
  /**
   * Debounce interval in ms between edits before a save is triggered.
   * @default 2000
   */
  debounceMs?: number
}

export interface UseDocumentAutosaveReturn {
  /** Query state for loading the current document */
  query: ReturnType<typeof useQuery<CurrentDocument>>
  /** Current save lifecycle state */
  saveState: SaveState
  /** Most recent content sent for saving */
  latestContent: unknown
  /** Current durable version (from last successful save or initial load) */
  version: number
  /** Mark editor as dirty on change — call with new BlockNote blocks */
  onChange: (blocks: unknown) => void
  /** Force a save now (e.g. manual snapshot) */
  saveNow: () => void
}

const DEFAULT_DEBOUNCE_MS = 2000

export function useDocumentAutosave(
  graphId: string | undefined,
  options: UseDocumentAutosaveOptions = {},
): UseDocumentAutosaveReturn {
  const { debounceMs = DEFAULT_DEBOUNCE_MS } = options

  const queryClient = useQueryClient()

  // Load current document from server
  const query = useQuery({
    queryKey: ['current-document', graphId],
    queryFn: () => getDocument(graphId!),
    enabled: Boolean(graphId),
    retry: false,
  })

  // ── Local state ────────────────────────────────────────────────────────
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [latestContent, setLatestContent] = useState<unknown>(null)

  // ── Refs for serialized write ordering ─────────────────────────────────
  // Monotonically increasing counter. Each scheduled save captures the
  // counter value at enqueue time. Only the callback whose counter matches
  // the latest enqueued value is allowed to commit.
  const seqRef = useRef(0)
  // Holds the counter of the currently-in-flight request, if any.
  const inflightSeqRef = useRef<number | null>(null)
  // Holds the version that the server last acknowledged.
  const versionRef = useRef<number>(query.data?.version ?? 0)
  // Holds the content associated with the acknowledged version.
  const contentRef = useRef<unknown>(query.data?.content ?? null)

  // Sync versionRef/contentRef when initial query loads fresh data.
  if (query.data && query.data.version !== versionRef.current) {
    versionRef.current = query.data.version
    contentRef.current = query.data.content
    // Reset UI state since we now have authoritative data from server.
    setSaveState('saved')
    setLatestContent(query.data.content)
  }

  // ── Schedule a save ────────────────────────────────────────────────────
  const scheduleSave = useCallback(() => {
    const content = contentRef.current
    if (content === null) return

    const seq = ++seqRef.current
    inflightSeqRef.current = seq

    setSaveState('saving')

    // We need the version at the moment of sending; capture it here so the
    // debounced callback closure gets a stable read.
    const version = versionRef.current

    putDocument(graphId!, { content, baseVersion: version })
      .then((resp) => {
        // Only accept this response if it belongs to the latest enqueue.
        if (inflightSeqRef.current !== seq) return
        inflightSeqRef.current = null

        // Bump local view of version / content only on accepted responses.
        versionRef.current = resp.version
        contentRef.current = resp.content

        // Stale responses from earlier enqueues do NOT clobber the UI.
        setSaveState('saved')
        setLatestContent(resp.content)

        // Update the TanStack Query cache so other consumers see the
        // authoritative version without a refetch.
        queryClient.setQueryData(['current-document', graphId], resp)
      })
      .catch(() => {
        if (inflightSeqRef.current !== seq) return
        inflightSeqRef.current = null

        // Keep the latest snapshot dirty and retryable. Never discard user
        // content on failure.
        setSaveState('save-failed')
      })
  }, [graphId, queryClient])

  // ── Public API ─────────────────────────────────────────────────────────
  const onChange = useCallback(
    (blocks: unknown) => {
      contentRef.current = blocks
      setLatestContent(blocks)
      setSaveState('dirty')

      // Cancel any pending debounce, re-schedule after the interval.
      clearTimeout((onChange as any)._timer)
      ;(onChange as any)._timer = setTimeout(scheduleSave, debounceMs)
    },
    [debounceMs, scheduleSave],
  )

  const saveNow = useCallback(() => {
    // Clear any pending debounce timer so scheduleSave isn't called twice.
    clearTimeout((onChange as any)._timer)
    scheduleSave()
  }, [scheduleSave, onChange])

  // ── Cleanup on unmount or graphId change ───────────────────────────────
  // When graphId changes, cancel any pending work by advancing the seq
  // counter so no in-flight callback can commit stale data.
  const prevGraphIdRef = useRef<string | undefined>(undefined)
  if (graphId !== prevGraphIdRef.current) {
    prevGraphIdRef.current = graphId
    // Invalidate pending debounced save: the next scheduled save will get a
    // fresh seq, making any in-flight request's seq stale.
    seqRef.current++
    clearTimeout((onChange as any)._timer)
    // Reset local state for the new document.
    setSaveState(query.data ? 'saved' : 'saved')
    setLatestContent(query.data?.content ?? null)
    if (query.data) {
      versionRef.current = query.data.version
      contentRef.current = query.data.content
    }
  }

  return {
    query,
    saveState,
    latestContent,
    version: versionRef.current,
    onChange,
    saveNow,
  }
}
