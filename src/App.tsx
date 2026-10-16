import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom'
import { useAuth } from './auth/useAuth'

const Home = lazy(() => import('./pages/Home'))
const MoviePage = lazy(() => import('./pages/MoviePage'))
const TVPage = lazy(() => import('./pages/TVPage'))
const PersonPage = lazy(() => import('./pages/PersonPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'))
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

// Scroll offset of each history entry, so Back returns to the same spot in a results grid.
const scrollPositions = new Map<string, number>()

// The page scrolls inside <body>, not the window: index.css gives html and body
// height:100% plus overflow-x:hidden, which turns body into the scroll container. So
// window.scrollTo is a no-op and the browser can't restore positions on Back.
// Following a link lands at the top of the new page; Back/Forward restore where
// that page was left. Query-only changes (filters, typing) keep the position.
function ScrollManager() {
  const { key, pathname } = useLocation()
  const navigationType = useNavigationType()
  const lastPathname = useRef(pathname)

  useLayoutEffect(() => {
    const body = document.body
    if (navigationType === 'POP') {
      body.scrollTop = scrollPositions.get(key) ?? 0
    } else {
      if (pathname !== lastPathname.current) body.scrollTop = 0
      // Filter changes replace the history entry under a new key; carry the offset over.
      scrollPositions.set(key, body.scrollTop)
    }
    lastPathname.current = pathname
  }, [key, pathname, navigationType])

  useEffect(() => {
    const body = document.body
    let frame = 0
    function onScroll() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => scrollPositions.set(key, body.scrollTop))
    }
    body.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      body.removeEventListener('scroll', onScroll)
    }
  }, [key])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movie/:id" element={<MoviePage />} />
          <Route path="/tv/:id" element={<TVPage />} />
          <Route path="/person/:id" element={<PersonPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
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
