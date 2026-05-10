import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth/useAuth'

const Home = lazy(() => import('./pages/Home'))
const MoviePage = lazy(() => import('./pages/MoviePage'))
const TVPage = lazy(() => import('./pages/TVPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const LibraryPage = lazy(() => import('./pages/LibraryPage'))

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-svh text-fg-muted text-[13px] tracking-widest uppercase">
      Loading…
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageFallback />
  if (!user) return <Navigate to="/auth?redirect=/library" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movie/:id" element={<MoviePage />} />
          <Route path="/tv/:id" element={<TVPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/library"
            element={
              <RequireAuth>
                <LibraryPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
