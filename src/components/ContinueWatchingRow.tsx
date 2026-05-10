import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useLibrary } from '../library/useLibrary'
import { IMG } from '../api'

export default function ContinueWatchingRow() {
  const { user } = useAuth()
  const { items } = useLibrary()

  if (!user) return null

  const recent = items
    .filter((it) => !!it.last_opened_at)
    .sort((a, b) => (b.last_opened_at ?? '').localeCompare(a.last_opened_at ?? ''))
    .slice(0, 12)

  if (recent.length === 0) return null

  return (
    <div className="mt-[52px] w-full max-w-[680px] flex flex-col items-center gap-4 animate-fade-up [animation-delay:1.2s] relative z-0">
      <p className="text-[9px] tracking-[0.25em] uppercase text-fg-dim">Continue Watching</p>
      <div className="flex gap-2.5 flex-wrap justify-center">
        {recent.map((it) => {
          const poster = IMG.poster(it.poster_path)
          const href =
            it.media_type === 'tv' && it.last_season && it.last_episode
              ? `/tv/${it.tmdb_id}?s=${it.last_season}&e=${it.last_episode}`
              : `/${it.media_type}/${it.tmdb_id}`
          const label = it.title ?? `${it.media_type} ${it.tmdb_id}`
          const subtitle =
            it.media_type === 'tv' && it.last_season && it.last_episode
              ? `S${it.last_season} · E${it.last_episode}`
              : null
          return (
            <Link
              key={`${it.media_type}-${it.tmdb_id}`}
              to={href}
              title={label}
              aria-label={label}
              className="relative w-[72px] h-[104px] rounded-[2px] overflow-hidden cursor-pointer bg-bg3 border border-white/6 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6)] focus-visible:outline-none focus-visible:border-accent block"
            >
              {poster ? (
                <img src={poster} alt="" className="size-full object-cover saturate-[0.7]" />
              ) : (
                <div className="size-full flex items-center justify-center font-heading text-2xl text-fg-muted">
                  {(label || '?')[0]}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 pt-5 px-1.5 pb-1.5 bg-linear-to-b from-transparent to-black/85 text-[8px] tracking-[0.04em] text-fg/70 text-center leading-tight font-sans">
                {subtitle ?? label}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
