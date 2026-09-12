import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles.css'
import WorkspaceList from './routes/index'
import AuthPage from './routes/auth/login'
import Register from './routes/auth/register'
import Workspace from './routes/workspace/$id'
import WorkspaceHome from './routes/workspace/$id/index'
import MembersRoute from './routes/workspace/$id/m'
import ListTasksPage from './routes/workspace/$id/s/l/$listid'
import OAuthCallback from './routes/oauth/$provider/callback'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
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
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
