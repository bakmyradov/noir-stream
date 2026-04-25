import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTVShow, getSeason, IMG } from '../api'
import Topbar from '../components/Topbar'
import SourceSelector from '../components/SourceSelector'
import { DEFAULT_SOURCE } from '../sources'
import { useEmbedFallback } from '../hooks/useEmbedFallback'
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
  const [sourceId, setSourceId] = useState(DEFAULT_SOURCE)

  useEffect(() => {
    if (!id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveEp(null)
    setShow(null)
    const controller = new AbortController()
    getTVShow(id, controller.signal)
      .then((data) => {
        setShow(data)
        const real = (data.seasons ?? []).filter((s) => s.season_number > 0)
        setSeasons(real)
        if (real.length > 0) setActiveSeason(real[0]!.season_number)
      })
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return
        navigate('/')
      })
    return () => controller.abort()
  }, [id, navigate])

  useEffect(() => {
    if (!id || !activeSeason) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingEps(true)
    const controller = new AbortController()
    getSeason(id, activeSeason, controller.signal)
      .then((data) => setEpisodes(data.episodes ?? []))
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return
        setEpisodes([])
      })
      .finally(() => setLoadingEps(false))
    return () => controller.abort()
  }, [id, activeSeason])

  function playEpisode(ep: Episode) {
    setActiveEp({ season: ep.season_number, episode: ep.episode_number, name: ep.name })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const embedKey = activeEp ? `tv-${id}-${activeEp.season}-${activeEp.episode}` : `tv-${id}-idle`
  const { source, onIframeLoad, onIframeError, reset } = useEmbedFallback(
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

      {!activeEp && (
        <div className="relative h-[520px] overflow-hidden max-[600px]:h-[340px]">
          <div className="absolute inset-0 bg-linear-to-br from-[#0d1a2a] via-[#1a0d0d] to-[#0d0d1a]">
            {show.backdrop_path && (
              <img
                src={IMG.backdrop(show.backdrop_path) ?? undefined}
                alt=""
                className="absolute inset-0 size-full object-cover opacity-25 saturate-[0.6]"
              />
            )}
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(8,8,16,0.85)_0%,rgba(8,8,16,0.3)_50%,transparent_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,8,16,0.15)_0%,rgba(8,8,16,0)_30%,rgba(8,8,16,0.6)_70%,rgba(8,8,16,1)_100%)]" />
        </div>
      )}

      {activeEp && embedUrl && (
        <>
          <div className="w-full aspect-video bg-black">
            <iframe
              key={`${id}-${activeEp.season}-${activeEp.episode}-${sourceId}`}
              src={embedUrl}
              allowFullScreen
              referrerPolicy="no-referrer"
              scrolling="no"
              title={`${show.name} S${activeEp.season}E${activeEp.episode}`}
              onLoad={onIframeLoad}
              onError={onIframeError}
              className="size-full border-none block"
            />
          </div>
          <SourceSelector
            active={sourceId}
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
        ) : (
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] max-[600px]:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
            {episodes.map((ep) => {
              const isActive =
                activeEp?.season === ep.season_number &&
                activeEp?.episode === ep.episode_number
              const still = IMG.still(ep.still_path)
              return (
                <div
                  key={ep.id}
                  onClick={() => playEpisode(ep)}
                  className={`episode-card relative cursor-pointer rounded-[2px] overflow-hidden bg-bg2 border transition-[border-color,transform,box-shadow] duration-250 hover:translate-y-[-3px] hover:border-white/10 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] ${
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
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
