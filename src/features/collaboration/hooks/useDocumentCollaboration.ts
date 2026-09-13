import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-partykit/provider'
import { getCollaborationAuth } from '../services/collaborationAuthService'
import type {
  CollaborationConnectionState,
  UseDocumentCollaborationOptions,
  UseDocumentCollaborationResult,
} from '../types'

type ProviderCleanup = () => void

/**
 * Manages a single Y.Doc + WebsocketProvider lifecycle for one document.
 */
export function useDocumentCollaboration({
  graphId,
  workspaceId,
}: UseDocumentCollaborationOptions): UseDocumentCollaborationResult {
  const [state, setState] = useState<CollaborationConnectionState>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [permissionMode, setPermissionMode] = useState<'read' | 'edit' | null>(null)

  const cycleTokenRef = useRef(0)
  const sessionRef = useRef<{
    provider: WebsocketProvider | null
    doc: Y.Doc | null
    cleanup: ProviderCleanup | null
  }>({ provider: null, doc: null, cleanup: null })

  // Mutable plain object ref so DocumentEditor can read current provider without re-rendering.
  const providerRefObj = useRef<{ value: WebsocketProvider | null }>({ value: null })
  const fragment = sessionRef.current.doc?.getXmlFragment('blocknote') ?? null
  const awareness = sessionRef.current.provider?.awareness ?? null

  useEffect(() => {
    const token = ++cycleTokenRef.current
    const prevSession = sessionRef.current

    // ── Teardown previous cycle ──────────────────────────────────────────────
    prevSession.provider?.destroy()
    prevSession.cleanup?.()
    prevSession.doc?.destroy()
    sessionRef.current = { provider: null, doc: null, cleanup: null }
    providerRefObj.current = { value: null }

    // ── Reject empty graphId ─────────────────────────────────────────────────
    if (!graphId) {
      console.log('[collab] empty graphId, skip')
      setState('disconnected')
      setError(null)
      setPermissionMode(null)
      return
    }

    console.log('[collab] starting connect', { graphId, workspaceId })
    setState('connecting')
    setError(null)

    // ── Fetch auth token ─────────────────────────────────────────────────────
    getCollaborationAuth(graphId, workspaceId)
      .then((authData) => {
        if (cycleTokenRef.current !== token) return

        console.log('[collab] auth ok, creating provider', {
          room: authData.room,
          websocketUrl: authData.websocketUrl,
          permissionMode: authData.permissionMode,
        })

        setPermissionMode(authData.permissionMode ?? 'edit')
        setState('connecting')

        const ydoc = new Y.Doc()

        // Build the full WS URL with token + room query params that the server expects.
        // WebsocketProvider with isPrefixedUrl:true uses the URL exactly as given —
        // no automatic param injection, so we build it here.
        const base = authData.websocketUrl.replace(/\/$/, '') // strip trailing slash
        const wsUrl = `${base}?token=${encodeURIComponent(authData.token ?? '')}&room=${encodeURIComponent(authData.room)}`
        console.log('[collab] ws connecting to', wsUrl)

        const wsProvider = new WebsocketProvider(wsUrl, authData.room, ydoc, {
          connect: true,
          isPrefixedUrl: true,
        })
        sessionRef.current = { provider: wsProvider, doc: ydoc, cleanup: null }
        providerRefObj.current = { value: wsProvider }

        // ── Connection state events ──────────────────────────────────────────
        const handleStatus = ({ status }: { status: string }) => {
          if (cycleTokenRef.current !== token) return
          console.log('[collab] status', { graphId, status, synced: (wsProvider as any).synced })
          setState(s =>
            status === 'connected'
              ? 'connected'
              : s === 'connected' && status === 'disconnected'
                ? 'reconnecting'
                : s,
          )
          if (status === 'connected') setError(null)
        }
        const handleError = (e?: unknown) => {
          if (cycleTokenRef.current !== token) return
          console.error('[collab] connection-error', e)
          setState('error')
          setError('PartyKit connection error — check network or room access.')
        }
        const handleDestroy = () => {
          if (cycleTokenRef.current !== token) return
          console.log('[collab] destroy')
          setState('disconnected')
        }

        wsProvider.on('status', handleStatus)
        wsProvider.on('connection-error', handleError)
        wsProvider.on('destroy', handleDestroy)

        sessionRef.current.cleanup = () => {
          wsProvider.off('status', handleStatus)
          wsProvider.off('connection-error', handleError)
          wsProvider.off('destroy', handleDestroy)
          wsProvider.destroy()
        }
      })
      .catch((err: unknown) => {
        if (cycleTokenRef.current !== token) return
        const message = err instanceof Error ? err.message : 'Auth failed'
        console.error('[collab] auth error', message, err)
        setError(message)
        setState('error')
      })

    // ── Cleanup on unmount / deps change ─────────────────────────────────────
    return () => {
      if (cycleTokenRef.current !== token) return
      const s = sessionRef.current
      s.provider?.destroy()
      s.cleanup?.()
      s.doc?.destroy()
      sessionRef.current = { provider: null, doc: null, cleanup: null }
    }
  }, [graphId, workspaceId])

  return { yDoc: sessionRef.current.doc, provider: sessionRef.current.provider, fragment, state, error, awareness, permissionMode, providerRef: providerRefObj.current }
}
