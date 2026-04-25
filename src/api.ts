import type {
  MediaSummary,
  MovieDetails,
  SeasonDetails,
  TVDetails,
} from './types'

const KEY = import.meta.env.VITE_TMDB_API_KEY as string | undefined
const BASE = 'https://api.themoviedb.org/3'

if (!KEY) {
  // Surfacing this at module load makes the misconfiguration obvious instead of failing
  // every request with an opaque 401.
  console.error('VITE_TMDB_API_KEY is not set — TMDB requests will fail.')
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${BASE}${path}${sep}api_key=${KEY ?? ''}`, { signal })
  if (!res.ok) throw new Error(`TMDB error ${res.status}`)
  return res.json() as Promise<T>
}

export const IMG = {
  poster: (p: string | null | undefined) =>
    p ? `https://image.tmdb.org/t/p/w342${p}` : null,
  backdrop: (p: string | null | undefined) =>
    p ? `https://image.tmdb.org/t/p/w1280${p}` : null,
  still: (p: string | null | undefined) =>
    p ? `https://image.tmdb.org/t/p/w300${p}` : null,
  thumb: (p: string | null | undefined) =>
    p ? `https://image.tmdb.org/t/p/w92${p}` : null,
}

interface PagedResults<T> {
  results?: T[]
}

function isMovieOrTV(r: { media_type?: string }): boolean {
  return r.media_type === 'movie' || r.media_type === 'tv'
}

export async function searchMulti(
  query: string,
  signal?: AbortSignal,
): Promise<MediaSummary[]> {
  const data = await get<PagedResults<MediaSummary>>(
    `/search/multi?query=${encodeURIComponent(query)}&include_adult=false`,
    signal,
  )
  return (data.results ?? []).filter(isMovieOrTV).slice(0, 7)
}

export function getMovie(id: string, signal?: AbortSignal): Promise<MovieDetails> {
  return get<MovieDetails>(`/movie/${id}`, signal)
}

export function getTVShow(id: string, signal?: AbortSignal): Promise<TVDetails> {
  return get<TVDetails>(`/tv/${id}`, signal)
}

export function getSeason(
  tvId: string,
  seasonNum: number,
  signal?: AbortSignal,
): Promise<SeasonDetails> {
  return get<SeasonDetails>(`/tv/${tvId}/season/${seasonNum}`, signal)
}

export async function getTrending(signal?: AbortSignal): Promise<MediaSummary[]> {
  const data = await get<PagedResults<MediaSummary>>(
    '/trending/all/week?language=en-US',
    signal,
  )
  return (data.results ?? []).filter(isMovieOrTV).slice(0, 5)
}
