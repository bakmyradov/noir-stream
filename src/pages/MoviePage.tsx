import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMovie, IMG } from '../api'
import Topbar from '../components/Topbar'
import SourceSelector from '../components/SourceSelector'
import { DEFAULT_SOURCE } from '../sources'
import { useEmbedFallback } from '../hooks/useEmbedFallback'
import type { MovieDetails } from '../types'

export default function MoviePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [movie, setMovie] = useState<MovieDetails | null>(null)
  const [playing, setPlaying] = useState(false)
  const [sourceId, setSourceId] = useState(DEFAULT_SOURCE)

  useEffect(() => {
    if (!id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlaying(false)
    setMovie(null)
    const controller = new AbortController()
    getMovie(id, controller.signal)
      .then(setMovie)
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return
        navigate('/')
      })
    return () => controller.abort()
  }, [id, navigate])

  const { source, onIframeLoad, onIframeError, reset } = useEmbedFallback(
    sourceId,
    setSourceId,
    `movie-${id}`,
  )

  if (!id) return null
  if (!movie) {
    return (
      <div className="flex items-center justify-center min-h-svh text-fg-muted text-[13px] tracking-widest uppercase">
        Loading…
      </div>
    )
  }

  const year = (movie.release_date || '').slice(0, 4)
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null
  const embedUrl = source.movie(id)

  return (
    <div className="min-h-svh bg-bg animate-fade-in">
      <Topbar />

      {!playing && (
        <div className="relative h-[520px] overflow-hidden max-[600px]:h-[340px]">
          <div className="absolute inset-0 bg-linear-to-br from-[#0d1a2a] via-[#1a0d0d] to-[#0d0d1a]">
            {movie.backdrop_path && (
              <img
                src={IMG.backdrop(movie.backdrop_path) ?? undefined}
                alt=""
                className="absolute inset-0 size-full object-cover opacity-25 saturate-[0.6]"
              />
            )}
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(8,8,16,0.85)_0%,rgba(8,8,16,0.3)_50%,transparent_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,8,16,0.15)_0%,rgba(8,8,16,0)_30%,rgba(8,8,16,0.6)_70%,rgba(8,8,16,1)_100%)]" />
        </div>
      )}

      {playing && (
        <>
          <div className="w-full aspect-video bg-black">
            <iframe
              key={`${id}-${sourceId}`}
              src={embedUrl}
              allowFullScreen
              referrerPolicy="no-referrer"
              scrolling="no"
              title={movie.title}
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
          playing ? 'mt-0 pt-8' : 'mt-[-180px] max-[600px]:mt-[-100px]'
        }`}
      >
        <div className="shrink-0">
          {IMG.poster(movie.poster_path) && (
            <img
              src={IMG.poster(movie.poster_path) ?? undefined}
              alt={movie.title}
              className="w-40 rounded-[2px] block shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)]"
            />
          )}
        </div>
        <div className={`flex-1 flex flex-col ${playing ? 'pt-0' : 'pt-[120px] max-[600px]:pt-0'}`}>
          <h1 className="font-heading text-[52px] font-normal leading-[1.05] tracking-[-0.01em] text-fg mb-3.5 max-[600px]:text-4xl">
            {movie.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-fg-muted tracking-[0.06em] uppercase">
            {year && <span>{year}</span>}
            {movie.runtime && <span>{movie.runtime} min</span>}
            {rating && (
              <span className="flex items-center gap-1.5 text-accent font-normal">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
                </svg>
                {rating}
              </span>
            )}
            {movie.genres?.map((g) => (
              <span
                key={g.id}
                className="text-[10px] tracking-[0.12em] uppercase border border-white/15 px-2.5 py-0.5 rounded-[2px] text-fg-muted font-normal"
              >
                {g.name}
              </span>
            ))}
          </div>
          {movie.overview && (
            <p className="text-sm leading-[1.75] text-fg-muted max-w-[560px] font-light mt-4">
              {movie.overview}
            </p>
          )}
          <button
            onClick={() => setPlaying(true)}
            className="inline-flex items-center gap-2.5 bg-accent text-bg-[#080810] border-none rounded-[2px] px-9 py-3 font-sans text-xs font-medium tracking-widest uppercase cursor-pointer mt-6 self-start transition-[filter,transform] duration-200 hover:brightness-110 hover:-translate-y-px"
          >
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
              <path d="M1 1l8 5L1 11V1z"/>
            </svg>
            {playing ? 'Now Playing' : 'Play Now'}
          </button>
        </div>
      </div>
    </div>
  )
}
