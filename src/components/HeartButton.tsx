import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useLibrary } from '../library/useLibrary'
import type { LibraryItemSnapshot } from '../library/LibraryContext'

interface HeartButtonProps {
  snapshot: LibraryItemSnapshot
}

export default function HeartButton({ snapshot }: HeartButtonProps) {
  const { user } = useAuth()
  const { isFavorited, toggleFavorite } = useLibrary()
  const navigate = useNavigate()
  const location = useLocation()

  const favorited = user ? isFavorited(snapshot.tmdb_id, snapshot.media_type) : false

  function onClick() {
    if (!user) {
      const redirect = encodeURIComponent(location.pathname + location.search)
      navigate(`/auth?redirect=${redirect}`)
      return
    }
    void toggleFavorite(snapshot)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={favorited}
      aria-label={favorited ? 'Remove from watchlist' : 'Add to watchlist'}
      title={favorited ? 'Remove from watchlist' : 'Add to watchlist'}
      className={`inline-flex items-center justify-center size-11 rounded-[2px] border cursor-pointer transition-[border-color,background,color,transform] duration-200 mt-6 hover:-translate-y-px ${
        favorited
          ? 'border-accent2 bg-accent/10 text-accent hover:bg-accent/15'
          : 'border-white/15 bg-transparent text-fg-muted hover:border-white/30 hover:text-fg'
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    </button>
  )
}
