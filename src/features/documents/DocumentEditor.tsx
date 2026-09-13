import { useRef } from 'react'
import { useCreateBlockNote, useEditorChange } from '@blocknote/react'
import { withCollaboration } from '@blocknote/core/yjs'
import { BlockNoteView } from '@blocknote/mantine'
import type { Block } from '@blocknote/core'
import * as Y from 'yjs'
import '@blocknote/mantine/style.css'

const NOTION_LIKE_THEME = {
  colors: {
    editor: { text: '#37352f', background: '#ffffff' },
    menu: { text: '#37352f', background: '#ffffff' },
    tooltip: { text: '#37352f', background: '#f0effc' },
    hovered: { text: '#37352f', background: '#efefef' },
    selected: { text: '#ffffff', background: '#2e2e2e' },
    disabled: { text: '#9b9a97', background: '#efefef' },
    shadow: '#c8c6c1',
    border: '#efefef',
    sideMenu: '#c8c6c1',
    highlights: {
      gray: { text: '#9b9a97', background: '#ebeced' },
      brown: { text: '#64473a', background: '#e9e5e3' },
      red: { text: '#e03e3e', background: '#fbe4e4' },
      orange: { text: '#d9730d', background: '#f6e9d9' },
      yellow: { text: '#dfab01', background: '#fbf3db' },
      green: { text: '#4d6461', background: '#ddedea' },
      blue: { text: '#0b6e99', background: '#ddebf1' },
      purple: { text: '#6940a5', background: '#eae4f2' },
      pink: { text: '#ad1a72', background: '#f4dfeb' },
    },
  },
  borderRadius: 4,
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
} as const

const scrollbarStyle = `
.bn-root::-webkit-scrollbar { width: 8px; height: 8px; }
.bn-root::-webkit-scrollbar-track { background: transparent; }
.bn-root::-webkit-scrollbar-thumb {
  background: #d1d0cc;
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
.bn-root::-webkit-scrollbar-thumb:hover { background: #b0aea8; }
.bn-root { scrollbar-width: thin; scrollbar-color: #d1d0cc transparent; }
.bn-root { --bn-ui-base-z-index: 100; }
.bn-root { min-height: 100%; }
`

export type DocumentEditorProps = {
  docId: string
  workspaceId: string
  /** Yjs fragment backing the editor (from collab provider). */
  yjsFragment: Y.XmlFragment | null
  /** Yjs provider for awareness transport */
  provider: YjsProviderRef | null
  /** User identity shown on collaboration cursors. Falls back to localStorage user or "Anonymous". */
  userName?: string
  onChange?: (blocks: Block[]) => void
  theme?: 'light' | 'dark'
  editorTheme?: Parameters<typeof BlockNoteView>[0]['theme']
  isReadOnly?: boolean
}

/** Mutable ref so we can access the provider from within the editor effect. */
type YjsProviderRef = { value: import('y-partykit/provider').WebsocketProvider | null }

/** Read the logged-in user's name from localStorage (set during login/register). */
export function getStoredUserName(): string | undefined {
  try {
    const raw = window.localStorage.getItem('user')
    if (!raw) return undefined
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed.name : undefined
  } catch {
    return undefined
  }
}

export function DocumentEditor({
  docId: _docId,
  yjsFragment,
  provider: providerRef,
  userName,
  onChange,
  theme: _theme,
  editorTheme = NOTION_LIKE_THEME,
  isReadOnly = false,
}: DocumentEditorProps) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Resolve display name: prop override > stored user > anonymous.
  const displayName = userName ?? getStoredUserName() ?? 'Anonymous'

  // Generate a deterministic-but-unique color per user so cursors are distinguishable.
  // Hash the document ID + display name so each person gets a different color.
  const userColor = useRef(
    (() => {
      const seed = `${_docId}-${displayName}`
      let hash = 0
      for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
      return `#${(hash & 0x00ffffff).toString(16).padStart(6, '0')}`
    })(),
  )

  // Editor is only rendered when provider is connected, so fragment & provider are present.
  const editor = useCreateBlockNote(
    withCollaboration({
      collaboration: {
        fragment: yjsFragment!,
        provider: providerRef!.value!,
        user: { name: displayName, color: userColor.current },
        showCursorLabels: 'activity',
      },
    }),
  )

  // Fire onSave whenever content changes (local or remote, via withCollaboration).
  useEditorChange(() => {
    onChangeRef.current?.(editor.document as Block[])
  }, editor)

  return (
    <>
      <style>{scrollbarStyle}</style>
      <BlockNoteView
        editor={editor}
        theme={editorTheme}
        slashMenu={!isReadOnly}
        sideMenu={!isReadOnly}
        formattingToolbar={!isReadOnly}
        editable={!isReadOnly}
      />
    </>
  )
}
