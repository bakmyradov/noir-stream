import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Topbar from '../components/Topbar'
import { useLibrary } from '../library/useLibrary'
import { IMG } from '../api'
import type { LibraryRow } from '../lib/database.types'

type Tab = 'watchlist' | 'continue' | 'history'

const TABS: { id: Tab; label: string }[] = [
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'continue', label: 'Continue Watching' },
  { id: 'history', label: 'History' },
]

function hrefFor(it: LibraryRow): string {
  if (it.media_type === 'tv' && it.last_season && it.last_episode) {
    return `/tv/${it.tmdb_id}?s=${it.last_season}&e=${it.last_episode}`
  }
  return `/${it.media_type}/${it.tmdb_id}`
}

function Card({ it, onRemove }: { it: LibraryRow; onRemove?: () => void }) {
  const poster = IMG.poster(it.poster_path)
  const label = it.title ?? `${it.media_type} ${it.tmdb_id}`
  const subtitle =
    it.media_type === 'tv' && it.last_season && it.last_episode
      ? `S${it.last_season} · E${it.last_episode}`
      : it.media_type === 'tv'
        ? 'TV Series'
        : 'Movie'
  return (
    <Link
      to={hrefFor(it)}
      title={label}
      className="group flex flex-col gap-2 cursor-pointer"
    >
      <div className="relative aspect-[2/3] rounded-[2px] overflow-hidden bg-bg3 border border-white/6 transition-[transform,box-shadow,border-color] duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.6)] group-hover:border-white/15">
        {poster ? (
          <img src={poster} alt="" className="size-full object-cover saturate-[0.75] group-hover:saturate-100 transition-[filter] duration-300" />
        ) : (
          <div className="size-full flex items-center justify-center font-heading text-3xl text-fg-muted">
            {(label || '?')[0]}
          </div>
        )}
        {onRemove && (
          <button
            type="button"
            aria-label={`Remove ${label} from history`}
            title="Remove from history"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemove()
            }}
            className="absolute top-1.5 right-1.5 z-10 flex size-7 items-center justify-center rounded-[2px] border border-white/15 bg-black/65 text-fg-muted opacity-0 transition-[opacity,color,border-color,background] duration-200 cursor-pointer group-hover:opacity-100 focus-visible:opacity-100 max-[600px]:opacity-100 hover:border-white/40 hover:bg-black/85 hover:text-fg"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex flex-col px-0.5">
        <span className="text-[13px] text-fg leading-tight font-normal line-clamp-2">{label}</span>
        <span className="text-[10px] tracking-[0.08em] uppercase text-accent mt-0.5">{subtitle}</span>
      </div>
    </Link>
  )
}

export default function LibraryPage() {
  const { items, loading, removeFromHistory, clearHistory } = useLibrary()
  const [tab, setTab] = useState<Tab>('watchlist')

  const filtered = useMemo(() => {
    if (tab === 'watchlist') {
      return items.filter((it) => it.favorited)
    }
    const withOpen = items.filter((it) => !!it.last_opened_at)
    withOpen.sort((a, b) => (b.last_opened_at ?? '').localeCompare(a.last_opened_at ?? ''))
    return tab === 'continue' ? withOpen.slice(0, 50) : withOpen
  }, [items, tab])

  return (
    <div className="min-h-svh bg-bg animate-fade-in">
      <Topbar />
      <div className="px-12 pt-[100px] pb-15 max-[600px]:px-5 max-[600px]:pt-[80px]">
        <h1 className="font-heading text-[40px] font-normal tracking-[-0.01em] text-fg mb-6 max-[600px]:text-3xl">
          Your Library
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-8">
          <div className="flex flex-wrap gap-1.5" role="tablist">
            {TABS.map((t) => {
              const active = t.id === tab
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-1.5 rounded-[2px] border font-sans text-[11px] tracking-[0.18em] uppercase cursor-pointer transition-all duration-200 ${
                    active
                      ? 'bg-accent/10 border-accent2 text-accent'
                      : 'border-white/10 text-fg-muted hover:border-white/22 hover:text-fg'
                  }`}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
          {tab === 'history' && filtered.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Clear your entire watch history? This also empties Continue Watching.')) {
                  void clearHistory()
                }
              }}
              className="px-4 py-1.5 rounded-[2px] border border-white/10 font-sans text-[11px] tracking-[0.18em] uppercase text-fg-muted cursor-pointer transition-all duration-200 hover:border-white/22 hover:text-fg"
            >
              Clear History
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-fg-muted py-12 text-center text-[13px] tracking-[0.04em]">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-fg-muted py-12 text-center text-[13px] tracking-[0.04em]">
            {tab === 'watchlist'
              ? 'No favorites yet — heart a movie or show to save it here.'
              : 'Nothing here yet — start watching something.'}
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(160px,1fr))] max-[600px]:grid-cols-[repeat(auto-fill,minmax(120px,1fr))] max-[600px]:gap-3.5">
            {filtered.map((it) => (
              <Card
                key={`${it.media_type}-${it.tmdb_id}`}
                it={it}
                onRemove={
                  tab === 'watchlist'
                    ? undefined
                    : () => void removeFromHistory(it.tmdb_id, it.media_type)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
