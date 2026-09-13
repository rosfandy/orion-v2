import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider, createTheme } from '@mantine/core'
import '@mantine/core/styles.css'
import './styles.css'
import WorkspaceList from './routes/index'
import AuthPage from './routes/auth/login'
import Register from './routes/auth/register'
import Workspace from './routes/workspace/$id'
import WorkspaceHome from './routes/workspace/$id/index'
import MembersRoute from './routes/workspace/$id/m'
import ListTasksPage from './routes/workspace/$id/s/l/$listid'
import DocumentPage from './routes/workspace/$id/s/d/$docid'
import OAuthCallback from './routes/oauth/$provider/callback'

const queryClient = new QueryClient()

// Notion-like theme — muted palette, Inter font, minimal chrome.
// T7/T8 can swap forceColorScheme for a user-preference store.
const theme = createTheme({
  // Override defaults at @mantine/core level (BlockNote reads these too).
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  fontFamilyMonospace: 'JetBrains Mono, ui-monospace, monospace',
  primaryColor: 'gray',
  autoContrast: true,
  luminanceThreshold: 0.45,
  /** Minimal chrome — close to Notion's flat aesthetic. */
  radius: {
    xs: '2px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<WorkspaceList />} />
            <Route path="/auth/login" element={<AuthPage />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/oauth/:provider/callback" element={<OAuthCallback />} />
            <Route path="/workspace/:id" element={<Workspace />}>
              <Route index element={<WorkspaceHome />} />
              <Route path="m" element={<MembersRoute />} />
              <Route path="s/l/:listid" element={<ListTasksPage />} />
              <Route path="s/d/:docid" element={<DocumentPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
