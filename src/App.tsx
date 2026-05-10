import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

const Home = lazy(() => import('./pages/Home'))
const MoviePage = lazy(() => import('./pages/MoviePage'))
const TVPage = lazy(() => import('./pages/TVPage'))

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-svh text-fg-muted text-[13px] tracking-widest uppercase">
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movie/:id" element={<MoviePage />} />
          <Route path="/tv/:id" element={<TVPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
