import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { getTVShow, getSeason, IMG } from '../api'
import Topbar from '../components/Topbar'
import SourceSelector from '../components/SourceSelector'
import DetailHero from '../components/DetailHero'
import HeartButton from '../components/HeartButton'
import { DEFAULT_SOURCE } from '../sources'
import { useEmbedFallback } from '../hooks/useEmbedFallback'
import { useLibrary } from '../library/useLibrary'
import type { ActiveEpisode, Episode, SeasonSummary, TVDetails } from '../types'

export default function TVPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [show, setShow] = useState<TVDetails | null>(null)
  const [seasons, setSeasons] = useState<SeasonSummary[]>([])
  const [activeSeason, setActiveSeason] = useState<number>(1)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [activeEp, setActiveEp] = useState<ActiveEpisode | null>(null)
  const [loadingEps, setLoadingEps] = useState(false)
  const [episodesError, setEpisodesError] = useState(false)
  const [episodesRetry, setEpisodesRetry] = useState(0)
  const [sourceId, setSourceId] = useState(DEFAULT_SOURCE)
  const { recordEpisode } = useLibrary()
  const [searchParams, setSearchParams] = useSearchParams()
  const pendingPreselectRef = useRef<{ s: number; e: number } | null>(null)

  useEffect(() => {
    if (!id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveEp(null)
    setShow(null)
    setSourceId(DEFAULT_SOURCE)

    const sParam = Number(searchParams.get('s'))
    const eParam = Number(searchParams.get('e'))
    pendingPreselectRef.current =
      Number.isFinite(sParam) && sParam > 0 && Number.isFinite(eParam) && eParam > 0
        ? { s: sParam, e: eParam }
        : null

    const controller = new AbortController()
    getTVShow(id, controller.signal)
      .then((data) => {
        setShow(data)
        const real = (data.seasons ?? []).filter((s) => s.season_number > 0)
        setSeasons(real)
        const preselect = pendingPreselectRef.current
        const initialSeason =
          preselect && real.some((s) => s.season_number === preselect.s)
            ? preselect.s
            : real[0]?.season_number ?? 1
        setActiveSeason(initialSeason)
      })
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return
        navigate('/')
      })
    return () => controller.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate])

  useEffect(() => {
    if (!id || !activeSeason) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingEps(true)
    setEpisodesError(false)
    const controller = new AbortController()
    getSeason(id, activeSeason, controller.signal)
      .then((data) => {
        const eps = data.episodes ?? []
        setEpisodes(eps)
        const preselect = pendingPreselectRef.current
        if (preselect && preselect.s === activeSeason) {
          const match = eps.find((ep) => ep.episode_number === preselect.e)
          if (match) {
            setActiveEp({ season: match.season_number, episode: match.episode_number, name: match.name })
          }
          pendingPreselectRef.current = null
        }
      })
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return
        setEpisodes([])
        setEpisodesError(true)
      })
      .finally(() => setLoadingEps(false))
    return () => controller.abort()
  }, [id, activeSeason, episodesRetry])

  function playEpisode(ep: Episode) {
    setActiveEp({ season: ep.season_number, episode: ep.episode_number, name: ep.name })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (id && show) {
      void recordEpisode(
        {
          tmdb_id: Number(id),
          media_type: 'tv',
          title: show.name,
          poster_path: show.poster_path,
        },
        ep.season_number,
        ep.episode_number,
      )
    }
    // Clear ?s=&e= query params once the user navigates around inside the page
    if (searchParams.has('s') || searchParams.has('e')) {
      const next = new URLSearchParams(searchParams)
      next.delete('s')
      next.delete('e')
      setSearchParams(next, { replace: true })
    }
  }

  const embedKey = activeEp ? `tv-${id}-${activeEp.season}-${activeEp.episode}` : `tv-${id}-idle`
  const { source, remaining, total, onIframeLoad, onIframeError, reset } = useEmbedFallback(
    sourceId,
    setSourceId,
    embedKey,
  )

  if (!id) return null
  if (!show) {
    return (
      <div className="flex items-center justify-center min-h-svh text-fg-muted text-[13px] tracking-widest uppercase">
        Loading…
      </div>
    )
  }

  const year = (show.first_air_date || '').slice(0, 4)
  const rating = show.vote_average ? show.vote_average.toFixed(1) : null
  const embedUrl = activeEp ? source.tv(id, activeEp.season, activeEp.episode) : null

  return (
    <div className="min-h-svh bg-bg animate-fade-in">
      <Topbar />

      {!activeEp && <DetailHero backdropPath={show.backdrop_path} />}

      {activeEp && embedUrl && (
        <>
          {/* Clear the fixed Topbar so the embed's own top controls stay clickable */}
          <div className="w-full aspect-video bg-black overflow-hidden mt-[60px] max-[600px]:mt-[52px]">
            {/* Cross-origin iframes don't reliably emit `error`; the watchdog
                inside useEmbedFallback is the primary fallback path. */}
            <iframe
              key={`${id}-${activeEp.season}-${activeEp.episode}-${sourceId}`}
              src={embedUrl}
              allowFullScreen
              referrerPolicy="no-referrer"
              title={`${show.name} S${activeEp.season}E${activeEp.episode}`}
              onLoad={onIframeLoad}
              onError={onIframeError}
              className="size-full border-none block"
            />
          </div>
          <SourceSelector
            active={sourceId}
            remaining={remaining}
            total={total}
            onChange={(id) => { setSourceId(id); reset() }}
          />
        </>
      )}

      <div
        className={`relative flex items-start gap-10 px-12 pb-15 animate-fade-up [animation-delay:0.1s] max-[600px]:flex-col max-[600px]:px-5 ${
          activeEp ? 'mt-0 pt-8' : 'mt-[-180px] max-[600px]:mt-[-100px]'
        }`}
      >
        <div className="shrink-0">
          {IMG.poster(show.poster_path) && (
            <img
              src={IMG.poster(show.poster_path) ?? undefined}
              alt={show.name}
              className="w-40 rounded-[2px] block shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)]"
            />
          )}
        </div>
        <div className={`flex-1 flex flex-col ${activeEp ? 'pt-0' : 'pt-[120px] max-[600px]:pt-0'}`}>
          <h1 className="font-heading text-[52px] font-normal leading-[1.05] tracking-[-0.01em] text-fg mb-3.5 max-[600px]:text-4xl">
            {show.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-fg-muted tracking-[0.06em] uppercase">
            {year && <span>{year}</span>}
            {show.number_of_seasons && <span>{show.number_of_seasons} Seasons</span>}
            {rating && (
              <span className="flex items-center gap-1.5 text-accent font-normal">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
                </svg>
                {rating}
              </span>
            )}
            {show.genres?.map((g) => (
              <span
                key={g.id}
                className="text-[10px] tracking-[0.12em] uppercase border border-white/15 px-2.5 py-0.5 rounded-[2px] text-fg-muted font-normal"
              >
                {g.name}
              </span>
            ))}
          </div>
          {show.overview && (
            <p className="text-sm leading-[1.75] text-fg-muted max-w-[560px] font-light mt-4">
              {show.overview}
            </p>
          )}
          {activeEp && (
            <p className="text-[11px] text-accent mt-3 tracking-[0.08em] uppercase">
              ▶ S{activeEp.season} E{activeEp.episode} — {activeEp.name}
            </p>
          )}
          <HeartButton
            snapshot={{
              tmdb_id: Number(id),
              media_type: 'tv',
              title: show.name,
              poster_path: show.poster_path,
            }}
          />
        </div>
      </div>

      <div className="px-12 pb-15 animate-fade-up [animation-delay:0.25s] max-[600px]:px-5 max-[600px]:pb-10">
        <div className="w-full h-px mt-10 mb-8 opacity-40 bg-linear-to-r from-accent2 to-transparent" />
        <p className="text-[9px] tracking-[0.3em] uppercase text-accent mb-4">Episodes</p>
        <div className="flex flex-wrap gap-1.5 mb-8">
          {seasons.map((s) => {
            const isActive = activeSeason === s.season_number
            return (
              <button
                key={s.season_number}
                onClick={() => setActiveSeason(s.season_number)}
                className={`bg-transparent border font-sans text-xs tracking-[0.06em] uppercase px-4.5 py-1.5 rounded-[2px] cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-accent/10 border-accent2 text-accent'
                    : 'border-white/10 text-fg-muted hover:border-white/22 hover:text-fg'
                }`}
              >
                Season {s.season_number}
              </button>
            )
          })}
        </div>

        {loadingEps ? (
          <div className="text-fg-muted py-6 text-center text-[13px] tracking-[0.04em]">
            Loading episodes…
          </div>
        ) : episodesError ? (
          <div className="text-fg-muted py-6 text-center text-[13px] tracking-[0.04em]">
            Failed to load episodes.{' '}
            <button
              onClick={() => setEpisodesRetry((n) => n + 1)}
              className="text-accent underline-offset-2 hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] max-[600px]:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
            {episodes.map((ep) => {
              const isActive =
                activeEp?.season === ep.season_number &&
                activeEp?.episode === ep.episode_number
              const still = IMG.still(ep.still_path)
              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => playEpisode(ep)}
                  className={`episode-card text-left relative cursor-pointer rounded-[2px] overflow-hidden bg-bg2 border transition-[border-color,transform,box-shadow] duration-250 hover:translate-y-[-3px] hover:border-white/10 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] focus-visible:outline-none focus-visible:border-accent ${
                    isActive
                      ? 'is-active border-accent2 shadow-[0_0_0_1px_var(--color-accent2)]'
                      : 'border-white/4'
                  }`}
                >
                  <div className="relative aspect-video bg-bg3 overflow-hidden">
                    {still ? (
                      <img
                        src={still}
                        alt={ep.name}
                        className="size-full object-cover block transition-transform duration-400 saturate-[0.8] [.episode-card:hover_&]:scale-[1.04] [.episode-card:hover_&]:saturate-100"
                      />
                    ) : (
                      <div className="size-full bg-linear-to-br from-bg2 to-bg3 flex items-center justify-center" />
                    )}
                    <span className="ep-play-icon" />
                  </div>
                  <div className="flex flex-col gap-1 px-3.5 pt-3 pb-3.5">
                    <span className="text-[9px] tracking-[0.2em] uppercase text-accent">
                      E{ep.episode_number}
                    </span>
                    <span className="text-[13px] font-normal text-fg leading-tight">
                      {ep.name}
                    </span>
                    {ep.runtime && (
                      <span className="text-[11px] text-fg-muted font-light">{ep.runtime} min</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
