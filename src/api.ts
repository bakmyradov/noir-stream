import type {
  DiscoverFilters,
  DiscoverSort,
  Genre,
  MediaSummary,
  MediaType,
  MovieDetails,
  MovieSummary,
  NamedEntity,
  Paged,
  PersonDetails,
  PersonSummary,
  SearchResult,
  SeasonDetails,
  TVDetails,
  TVSummary,
} from './types'

const KEY = import.meta.env.VITE_TMDB_API_KEY as string | undefined
const BASE = 'https://api.themoviedb.org/3'

export const TMDB_KEY_PRESENT = !!KEY

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
  profile: (p: string | null | undefined) =>
    p ? `https://image.tmdb.org/t/p/w185${p}` : null,
}

// TMDB refuses pages past 500 even when total_pages reports more.
const MAX_PAGES = 500

type Untagged<T> = Omit<T, 'media_type'>

// Single-type endpoints (search/movie, discover/*, find) omit media_type; add it back
// so every result can be routed the same way.
function tag<T extends SearchResult>(items: Untagged<T>[] | undefined, media_type: T['media_type']): T[] {
  return (items ?? []).map((it) => ({ ...it, media_type }) as unknown as T)
}

function isSearchResult(r: { media_type?: string }): r is SearchResult {
  return r.media_type === 'movie' || r.media_type === 'tv' || r.media_type === 'person'
}

function paged<T>(data: Partial<Paged<unknown>>, results: T[]): Paged<T> {
  return {
    page: data.page ?? 1,
    total_pages: Math.min(data.total_pages ?? 0, MAX_PAGES),
    total_results: data.total_results ?? 0,
    results,
  }
}

async function getTagged<T extends SearchResult>(
  path: string,
  media_type: T['media_type'],
  signal?: AbortSignal,
): Promise<Paged<T>> {
  const data = await get<Partial<Paged<Untagged<T>>>>(path, signal)
  return paged(data, tag<T>(data.results, media_type))
}

export async function searchMulti(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const data = await get<Partial<Paged<{ media_type?: string }>>>(
    `/search/multi?query=${encodeURIComponent(query)}&include_adult=false`,
    signal,
  )
  return (data.results ?? []).filter(isSearchResult)
}

export type SearchType = 'all' | MediaType | 'person'

/** One page of full search results. `year` only narrows movie and TV searches. */
export async function searchPage(
  type: SearchType,
  query: string,
  page: number,
  year: number | undefined,
  signal?: AbortSignal,
): Promise<Paged<SearchResult>> {
  const q = `query=${encodeURIComponent(query)}&include_adult=false&page=${page}`
  switch (type) {
    case 'movie':
      return getTagged<MovieSummary>(
        `/search/movie?${q}${year ? `&primary_release_year=${year}` : ''}`,
        'movie',
        signal,
      )
    case 'tv':
      return getTagged<TVSummary>(
        `/search/tv?${q}${year ? `&first_air_date_year=${year}` : ''}`,
        'tv',
        signal,
      )
    case 'person':
      return getTagged<PersonSummary>(`/search/person?${q}`, 'person', signal)
    default: {
      const data = await get<Partial<Paged<{ media_type?: string }>>>(`/search/multi?${q}`, signal)
      return paged(data, (data.results ?? []).filter(isSearchResult))
    }
  }
}

/** Resolves an IMDb id (tt… for titles, nm… for people) to TMDB results. */
export async function findByImdbId(
  imdbId: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const data = await get<{
    movie_results?: Untagged<MovieSummary>[]
    tv_results?: Untagged<TVSummary>[]
    person_results?: Untagged<PersonSummary>[]
  }>(`/find/${imdbId}?external_source=imdb_id`, signal)
  return [
    ...tag<MovieSummary>(data.movie_results, 'movie'),
    ...tag<TVSummary>(data.tv_results, 'tv'),
    ...tag<PersonSummary>(data.person_results, 'person'),
  ]
}

type RawDetails<T> = Omit<T, 'recommendations'> & {
  recommendations?: { results?: Untagged<MediaSummary>[] }
}

export async function getMovie(id: string, signal?: AbortSignal): Promise<MovieDetails> {
  const { recommendations, ...movie } = await get<RawDetails<MovieDetails>>(
    `/movie/${id}?append_to_response=credits,recommendations`,
    signal,
  )
  return {
    ...movie,
    recommendations: tag<MovieSummary>(
      recommendations?.results as Untagged<MovieSummary>[] | undefined,
      'movie',
    ),
  }
}

export async function getTVShow(id: string, signal?: AbortSignal): Promise<TVDetails> {
  const { recommendations, ...show } = await get<RawDetails<TVDetails>>(
    `/tv/${id}?append_to_response=credits,recommendations`,
    signal,
  )
  return {
    ...show,
    recommendations: tag<TVSummary>(
      recommendations?.results as Untagged<TVSummary>[] | undefined,
      'tv',
    ),
  }
}

export function getSeason(
  tvId: string,
  seasonNum: number,
  signal?: AbortSignal,
): Promise<SeasonDetails> {
  return get<SeasonDetails>(`/tv/${tvId}/season/${seasonNum}`, signal)
}

export function getPerson(id: string, signal?: AbortSignal): Promise<PersonDetails> {
  return get<PersonDetails>(`/person/${id}?append_to_response=combined_credits`, signal)
}

export async function getTrending(signal?: AbortSignal): Promise<MediaSummary[]> {
  const data = await get<Partial<Paged<{ media_type?: string }>>>(
    '/trending/all/week?language=en-US',
    signal,
  )
  return (data.results ?? [])
    .filter((r): r is MediaSummary => r.media_type === 'movie' || r.media_type === 'tv')
    .slice(0, 5)
}

// Genre lists never change during a session, so each is fetched once.
const genreCache = new Map<MediaType, Promise<Genre[]>>()

export function getGenres(type: MediaType): Promise<Genre[]> {
  let pending = genreCache.get(type)
  if (!pending) {
    pending = get<{ genres?: Genre[] }>(`/genre/${type}/list`).then((d) => d.genres ?? [])
    pending.catch(() => genreCache.delete(type))
    genreCache.set(type, pending)
  }
  return pending
}

export async function searchKeywords(
  query: string,
  signal?: AbortSignal,
): Promise<NamedEntity[]> {
  const data = await get<Partial<Paged<NamedEntity>>>(
    `/search/keyword?query=${encodeURIComponent(query)}`,
    signal,
  )
  return (data.results ?? []).slice(0, 8).map((k) => ({ id: k.id, name: k.name }))
}

export async function searchCompanies(
  query: string,
  signal?: AbortSignal,
): Promise<NamedEntity[]> {
  const data = await get<Partial<Paged<NamedEntity & { origin_country?: string }>>>(
    `/search/company?query=${encodeURIComponent(query)}`,
    signal,
  )
  // Company names repeat a lot ("Warner Bros." × many), so the country helps tell them apart.
  return (data.results ?? []).slice(0, 8).map((c) => ({
    id: c.id,
    name: c.name,
    hint: c.origin_country || undefined,
  }))
}

type NamedKind = 'keyword' | 'company'

// Discover URLs only carry ids; chips need names, so look them up once and keep them.
const nameCache = new Map<string, Promise<NamedEntity>>()

export function lookupName(kind: NamedKind, id: number): Promise<NamedEntity> {
  const k = `${kind}:${id}`
  let pending = nameCache.get(k)
  if (!pending) {
    pending = get<NamedEntity>(`/${kind}/${id}`).then((d) => ({ id: d.id, name: d.name }))
    pending.catch(() => nameCache.delete(k))
    nameCache.set(k, pending)
  }
  return pending
}

/** Seeds the name cache with an entity the user just picked, so its chip renders without a fetch. */
export function rememberName(kind: NamedKind, entity: NamedEntity): void {
  nameCache.set(`${kind}:${entity.id}`, Promise.resolve({ id: entity.id, name: entity.name }))
}

/** TMDB's TV "Talk" and "News" genre ids. */
export const TV_TALK_NEWS = [10767, 10763]

const SORT_BY: Record<MediaType, Record<DiscoverSort, string>> = {
  movie: {
    popular: 'popularity.desc',
    rating: 'vote_average.desc',
    newest: 'primary_release_date.desc',
    oldest: 'primary_release_date.asc',
  },
  tv: {
    popular: 'popularity.desc',
    rating: 'vote_average.desc',
    newest: 'first_air_date.desc',
    oldest: 'first_air_date.asc',
  },
}

export function discover(
  type: MediaType,
  f: DiscoverFilters,
  page: number,
  signal?: AbortSignal,
): Promise<Paged<MediaSummary>> {
  const dateField = type === 'movie' ? 'primary_release_date' : 'first_air_date'
  const p = new URLSearchParams({
    include_adult: 'false',
    page: String(page),
    sort_by: SORT_BY[type][f.sort],
  })
  // Genres must all match; keywords and studios match any of the picked ones.
  if (f.genres.length) p.set('with_genres', f.genres.join(','))
  // Popular TV is otherwise wall-to-wall talk shows and news; show them only on request.
  if (type === 'tv' && !f.genres.some((g) => TV_TALK_NEWS.includes(g))) {
    p.set('without_genres', TV_TALK_NEWS.join(','))
  }
  if (f.keywords.length) p.set('with_keywords', f.keywords.join('|'))
  if (f.studios.length) p.set('with_companies', f.studios.join('|'))
  if (type === 'tv' && f.network) p.set('with_networks', String(f.network))
  if (f.yearFrom) p.set(`${dateField}.gte`, `${f.yearFrom}-01-01`)
  if (f.yearTo) p.set(`${dateField}.lte`, `${f.yearTo}-12-31`)
  // Without a cap, "newest" is all unreleased announcements.
  else if (f.sort === 'newest') p.set(`${dateField}.lte`, new Date().toISOString().slice(0, 10))
  if (f.minRating) p.set('vote_average.gte', String(f.minRating))
  // Rating sorts and date sorts are dominated by titles with a handful of votes
  // unless there's a floor.
  const minVotes =
    f.sort === 'rating' || f.minRating ? (type === 'movie' ? 100 : 50) : f.sort === 'popular' ? 0 : 10
  if (minVotes) p.set('vote_count.gte', String(minVotes))
  if (f.runtimeMin) p.set('with_runtime.gte', String(f.runtimeMin))
  if (f.runtimeMax) p.set('with_runtime.lte', String(f.runtimeMax))
  if (f.language) p.set('with_original_language', f.language)

  const path = `/discover/${type}?${p}`
  return type === 'movie'
    ? getTagged<MovieSummary>(path, 'movie', signal)
    : getTagged<TVSummary>(path, 'tv', signal)
}
