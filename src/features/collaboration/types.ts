import type { Awareness } from 'y-protocols/awareness'
import type { WebsocketProvider } from 'y-partykit/provider'
import type * as Y from 'yjs'

/**
 * Connection-state enum. Never maps to durable "Saved" — that belongs to the
 * autosave/persistence layer.
 */
export type CollaborationConnectionState =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error'

export interface CollaborationAuthData {
  room: string
  websocketUrl: string
  token: string
  permissionMode?: 'read' | 'edit'
}

export interface UseDocumentCollaborationOptions {
  graphId: string
  workspaceId: string
  /** Caller-supplied identity; defaults to anonymous. */
  userId?: string
  userName?: string
  userColor?: string
}

export interface UseDocumentCollaborationResult {
  yDoc: Y.Doc | null
  provider: WebsocketProvider | null
  /** BlockNote-compatible XML fragment keyed by 'blocknote'. */
  fragment: Y.XmlFragment | null
  state: CollaborationConnectionState
  error: string | null
  awareness: Awareness | null
  permissionMode: 'read' | 'edit' | null
  /** Mutable ref to current provider — read inside BlockNote without re-render. */
  providerRef: { value: WebsocketProvider | null }
}
