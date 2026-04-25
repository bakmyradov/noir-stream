import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import LogoMark from '../components/LogoMark'
import { getTrending, IMG } from '../api'
import type { MediaSummary } from '../types'

export default function Home() {
  const [featured, setFeatured] = useState<MediaSummary[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const controller = new AbortController()
    getTrending(controller.signal)
      .then(setFeatured)
      .catch(() => {})
    return () => controller.abort()
  }, [])

  function openItem(item: MediaSummary) {
    navigate(`/${item.media_type}/${item.id}`)
  }

  return (
    <div className="flex items-center justify-center min-h-svh p-5 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,#1a1428_0%,var(--color-bg)_70%)] animate-fade-in">
      <div className="text-center w-full max-w-[580px] flex flex-col items-center">
        <div className="flex flex-col items-center gap-5 mb-[52px]">
          <div className="text-accent animate-fade-up [animation-delay:0.1s]">
            <LogoMark style="aperture" size={52} />
          </div>
          <div className="flex flex-col items-center self-stretch animate-fade-up [animation-delay:0.3s]">
            <span className="font-heading font-light text-[72px] tracking-[0.32em] text-fg leading-none uppercase pl-[0.32em] [text-shadow:0_0_60px_rgba(200,170,100,0.08)] max-[600px]:text-[52px]">
              NOIR
            </span>
            <div className="w-0 h-px self-stretch mt-2.5 bg-linear-to-r from-transparent via-accent to-transparent animate-underline-grow" />
            <span className="text-[9px] tracking-[0.38em] uppercase text-accent font-normal mt-2 opacity-0 animate-[fadeIn_0.6s_ease_1.2s_forwards]">
              Cinema Streaming
            </span>
          </div>
        </div>

        <p className="text-[13px] tracking-[0.04em] text-fg-muted mb-7 font-light animate-fade-up [animation-delay:0.6s]">
          Search for any film or series to begin
        </p>

        <SearchBar autoFocus />

        {featured.length > 0 && (
          <div className="mt-[52px] flex flex-col items-center gap-4 animate-fade-up [animation-delay:1.4s] relative z-0">
            <p className="text-[9px] tracking-[0.25em] uppercase text-fg-dim">Featured</p>
            <div className="flex gap-2.5">
              {featured.map((item) => {
                const title = item.media_type === 'movie' ? item.title : item.name
                const poster = IMG.poster(item.poster_path)
                return (
                  <div
                    key={item.id}
                    className="relative w-[72px] h-[104px] rounded-[2px] overflow-hidden cursor-pointer bg-bg3 border border-white/6 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
                    onClick={() => openItem(item)}
                    title={title}
                  >
                    {poster ? (
                      <img src={poster} alt={title} className="size-full object-cover saturate-[0.7]" />
                    ) : (
                      <div className="size-full flex items-center justify-center font-heading text-2xl text-fg-muted">
                        {(title || '?')[0]}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 pt-5 px-1.5 pb-1.5 bg-linear-to-b from-transparent to-black/85 text-[8px] tracking-[0.04em] text-fg/70 text-center leading-tight font-sans">
                      {title}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
