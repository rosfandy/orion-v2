import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  MdCloudOff,
  MdCloudSync,
  MdCheckCircle,
  MdWarning,
} from 'react-icons/md'
import { useGraphById } from '#/features/graphs/hooks/useGraph'
import {
  DocumentEditor,
  getStoredUserName,
} from '#/features/documents/DocumentEditor'
import { useDocumentAutosave } from '#/features/documents/useDocumentAutosave'
import { useDocumentCollaboration } from '#/features/collaboration/hooks/useDocumentCollaboration'
import type { Block } from '@blocknote/core'

/** Deterministic initialization: durable content seeds the editor; Yjs merges on top. */
function useDocumentPageState(graphId: string, workspaceId: string) {
  // ── Durable state ────────────────────────────────────────────────────────
  const autosave = useDocumentAutosave(graphId)

  // ── Collaboration state ──────────────────────────────────────────────────
  const collab = useDocumentCollaboration({ graphId, workspaceId })

  // ── Resolved editor content ──────────────────────────────────────────────
  // Durable snapshot is the seed; Yjs remote changes merge on top.
  const initialContent = useMemo<Block[] | undefined>(() => {
    const data = autosave.query.data
    if (!data?.content) return undefined
    if (Array.isArray(data.content)) return data.content as Block[]
    return undefined
  }, [autosave.query.data])

  // ── Read-only determination ──────────────────────────────────────────────
  const isReadOnly = collab.permissionMode === 'read'

  return {
    autosave,
    collab,
    initialContent,
    isReadOnly,
  }
}

export default function DocumentPage() {
  const { id = '', docid = '' } = useParams<{ id: string; docid: string }>()

  // Preload document node for sidebar hierarchy (existing behavior).
  useGraphById(docid)

  const { autosave, collab, isReadOnly } = useDocumentPageState(docid, id)

  // ── Connection-state badge (independent of save state) ───────────────────
  const connectionBadge = useMemo(() => {
    switch (collab.state) {
      case 'connecting':
        return (
          <span
            className="inline-flex items-center gap-1.5 text-xs text-amber-600"
            title="Connecting to document…"
          >
            <MdCloudSync className="size-3.5 animate-spin" /> Connecting
          </span>
        )
      case 'connected':
        return (
          <span
            className="inline-flex items-center gap-1.5 text-xs text-emerald-600"
            title="Connected to collaboration room"
          >
            <MdCheckCircle className="size-3.5" /> Connected
          </span>
        )
      case 'reconnecting':
        return (
          <span
            className="inline-flex items-center gap-1.5 text-xs text-amber-600"
            title="Reconnecting to document…"
          >
            <MdCloudSync className="size-3.5 animate-spin" /> Reconnecting
          </span>
        )
      case 'error':
        return (
          <span
            className="inline-flex items-center gap-1.5 text-xs text-red-600"
            title={collab.error ?? 'Collaboration error'}
          >
            <MdCloudOff className="size-3.5" /> Connection error: {collab.error}
          </span>
        )
      default:
        return null
    }
  }, [collab.state, collab.error])

  // ── Save-state badge (independent of connection state) ───────────────────
  const saveBadge = useMemo(() => {
    switch (autosave.saveState) {
      case 'dirty':
        return (
          <span
            className="inline-flex items-center gap-1.5 text-xs text-gray-500"
            title="Unsaved changes"
          >
            <span className="size-2 rounded-full bg-gray-400" /> Unsaved
          </span>
        )
      case 'saving':
        return (
          <span
            className="inline-flex items-center gap-1.5 text-xs text-blue-600"
            title="Saving…"
          >
            <MdCloudSync className="size-3.5 animate-spin" /> Saving
          </span>
        )
      case 'save-failed':
        return (
          <span
            className="inline-flex items-center gap-1.5 text-xs text-red-600 cursor-pointer hover:underline"
            title="Save failed — click to retry"
            onClick={() => autosave.saveNow()}
          >
            <MdWarning className="size-3.5" /> Save failed (retry)
          </span>
        )
      case 'saved':
      default:
        return (
          <span
            className="inline-flex items-center gap-1.5 text-xs text-emerald-600"
            title="Saved to server"
          >
            <MdCheckCircle className="size-3.5" /> Saved
          </span>
        )
    }
  }, [autosave.saveState, autosave.saveNow])

  return (
    <div className="flex flex-col h-screen">
      {/* Status bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-1.5 shrink-0">
        <div className="flex items-center gap-4">
          {connectionBadge}
          <span className="text-xs text-muted-foreground">·</span>
          {saveBadge}
        </div>
        {isReadOnly && (
          <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
            Read-only
          </span>
        )}
      </div>

      {/* Editor — fills remaining vertical space, scrolls internally */}
      <div className="flex-1 min-h-0">
        {collab.state === 'connected' || collab.state === 'reconnecting' ? (
          <DocumentEditor
            docId={docid}
            workspaceId={id}
            yjsFragment={collab.fragment}
            provider={collab.providerRef}
            userName={getStoredUserName()}
            isReadOnly={isReadOnly}
            onChange={(blocks: Block[]) => {
              autosave.onChange(blocks)
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Connecting to document…
          </div>
        )}
      </div>
    </div>
  )
}
