import { Link } from 'react-router-dom'
import { IMG } from '../api'
import { hrefOf, mediaSubtitle, ratingOf, resultKey, titleOf } from '../media'
import type { SearchResult } from '../types'

interface PosterCardProps {
  to: string
  title: string
  imageUrl: string | null
  subtitle?: string | null
  rating?: number
  className?: string
  /** Overlay controls drawn on top of the poster (e.g. a remove button). */
  children?: React.ReactNode
}

export default function PosterCard({ to, title, imageUrl, subtitle, rating, className = '', children }: PosterCardProps) {
  return (
    <Link
      to={to}
      title={title}
      className={`group flex flex-col gap-2 cursor-pointer outline-none ${className}`}
    >
      <div className="relative aspect-[2/3] rounded-[2px] overflow-hidden bg-bg3 border border-white/6 transition-[transform,box-shadow,border-color] duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.6)] group-hover:border-white/15 group-focus-visible:border-accent">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover saturate-[0.75] group-hover:saturate-100 transition-[filter] duration-300"
          />
        ) : (
          <div className="size-full flex items-center justify-center font-heading text-3xl text-fg-muted">
            {(title || '?')[0]}
          </div>
        )}
        {rating ? (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-[2px] bg-black/70 text-[10px] text-accent tracking-[0.04em]">
            <span aria-hidden="true">★ </span>
            <span className="sr-only">Rated </span>
            {rating.toFixed(1)}
          </span>
        ) : null}
        {children}
      </div>
      <div className="flex flex-col px-0.5">
        <span className="text-[13px] text-fg leading-tight font-normal line-clamp-2">{title}</span>
        {subtitle && (
          <span className="text-[10px] tracking-[0.08em] uppercase text-accent mt-0.5 line-clamp-1">{subtitle}</span>
        )}
      </div>
    </Link>
  )
}

interface ResultCardProps {
  item: SearchResult
  /** Replaces the default "Movie · 1999" / department line. */
  subtitle?: string
  className?: string
}

/** A poster card for any TMDB search result, person or title. */
export function ResultCard({ item, subtitle, className }: ResultCardProps) {
  if (item.media_type === 'person') {
    return (
      <PosterCard
        to={hrefOf(item)}
        title={item.name}
        imageUrl={IMG.profile(item.profile_path)}
        subtitle={subtitle ?? item.known_for_department}
        className={className}
      />
    )
  }
  return (
    <PosterCard
      to={hrefOf(item)}
      title={titleOf(item)}
      imageUrl={IMG.poster(item.poster_path)}
      subtitle={subtitle ?? mediaSubtitle(item)}
      rating={ratingOf(item)}
      className={className}
    />
  )
}

export function PosterGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(160px,1fr))] max-[600px]:grid-cols-[repeat(auto-fill,minmax(120px,1fr))] max-[600px]:gap-3.5">
      {children}
    </div>
  )
}

/** A single horizontally scrolling row of result cards. */
export function PosterRow({ items, label }: { items: SearchResult[]; label: string }) {
  return (
    <ul aria-label={label} className="flex gap-4 overflow-x-auto pt-1 pb-3 -mx-1 px-1 snap-x list-none max-[600px]:gap-3">
      {items.map((item) => (
        <li key={resultKey(item)} className="w-[140px] shrink-0 snap-start max-[600px]:w-[112px]">
          <ResultCard item={item} />
        </li>
      ))}
    </ul>
  )
}
