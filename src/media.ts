import type { MediaSummary, SearchResult } from './types'

export function titleOf(item: MediaSummary): string {
  return item.media_type === 'movie' ? item.title : item.name
}

/** Release / first-air date as YYYY-MM-DD, or '' when TMDB has none. */
export function dateOf(item: MediaSummary): string {
  return (item.media_type === 'movie' ? item.release_date : item.first_air_date) || ''
}

export function yearOf(item: MediaSummary): string {
  return dateOf(item).slice(0, 4)
}

/** Undated titles (announced, in development) sort last either way. */
export function compareByDate(a: MediaSummary, b: MediaSummary, order: 'newest' | 'oldest'): number {
  const da = dateOf(a)
  const db = dateOf(b)
  if (!da || !db) return (da ? 0 : 1) - (db ? 0 : 1)
  return order === 'newest' ? db.localeCompare(da) : da.localeCompare(db)
}

export function hrefOf(item: SearchResult): string {
  return `/${item.media_type}/${item.id}`
}

/** Movie and TV ids are separate namespaces on TMDB, so ids alone can collide. */
export function resultKey(item: SearchResult): string {
  return `${item.media_type}-${item.id}`
}

export function typeLabel(item: MediaSummary): string {
  return item.media_type === 'tv' ? 'TV' : 'Movie'
}

/** "Movie · 1999" */
export function mediaSubtitle(item: MediaSummary): string {
  const year = yearOf(item)
  return year ? `${typeLabel(item)} · ${year}` : typeLabel(item)
}

/** The rating worth showing: hides 0.0 and scores from a handful of votes. */
export function ratingOf(item: MediaSummary): number | undefined {
  return item.vote_average && (item.vote_count ?? 0) >= 10 ? item.vote_average : undefined
}

/** "1 result", "1,294 results" */
export function plural(n: number, word: string): string {
  return `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`
}

const IMDB_ID =/\b((?:tt|nm)\d{7,10})\b/
const TRAILING_YEAR = /^(.*\S)\s+((?:19|20)\d{2})$/

export interface ParsedQuery {
  /** What to send to TMDB. */
  text: string
  /** A trailing year the user typed ("dune 1984"); TMDB search ignores years in the text. */
  year?: number
  /** An IMDb id or link pasted into the box. */
  imdbId?: string
}

export function parseQuery(raw: string): ParsedQuery {
  const text = raw.trim()
  const imdb = text.match(IMDB_ID)?.[1]
  if (imdb) return { text, imdbId: imdb }
  const m = text.match(TRAILING_YEAR)
  const year = Number(m?.[2])
  // Years past next year are title words ("Blade Runner 2049"), not release years.
  if (m?.[1] && year <= new Date().getFullYear() + 1) return { text: m[1], year }
  return { text }
}

/**
 * Moves titles from `year`, or with the year in their name ("Wonder Woman 1984"),
 * to the top. Everything else keeps TMDB's order.
 */
export function preferYear<T extends SearchResult>(items: T[], year: number | undefined): T[] {
  if (!year) return items
  const y = String(year)
  const hit = (r: SearchResult) =>
    r.media_type !== 'person' && (yearOf(r) === y || titleOf(r).includes(y))
  return [...items.filter(hit), ...items.filter((r) => !hit(r))]
}
