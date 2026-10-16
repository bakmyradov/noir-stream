import { idListParam, intParam } from './hooks/useUrlParams'
import type { DiscoverFilters, DiscoverSort, MediaType } from './types'

const THIS_YEAR = new Date().getFullYear()

/** Next year down to 1900, for year pickers. */
export const YEARS = Array.from({ length: THIS_YEAR + 2 - 1900 }, (_, i) => THIS_YEAR + 1 - i)

export const MIN_RATINGS = [5, 6, 7, 8]

export const DISCOVER_SORTS: { id: DiscoverSort; label: string }[] = [
  { id: 'popular', label: 'Most popular' },
  { id: 'rating', label: 'Top rated' },
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
]

// TMDB codes; note `zh` is Mandarin and `cn` is Cantonese.
export const LANGUAGES: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Mandarin' },
  { code: 'cn', name: 'Cantonese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'tr', name: 'Turkish' },
  { code: 'ru', name: 'Russian' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'fa', name: 'Persian' },
]

// TMDB has no network search endpoint, so this is a hand-picked list (ids checked
// against /network/{id}).
export const NETWORKS: { group: string; items: { id: number; name: string }[] }[] = [
  {
    group: 'Streaming',
    items: [
      { id: 213, name: 'Netflix' },
      { id: 1024, name: 'Prime Video' },
      { id: 2739, name: 'Disney+' },
      { id: 2552, name: 'Apple TV' },
      { id: 3186, name: 'HBO Max' },
      { id: 453, name: 'Hulu' },
      { id: 4330, name: 'Paramount+' },
      { id: 3353, name: 'Peacock' },
      { id: 1112, name: 'Crunchyroll' },
    ],
  },
  {
    group: 'US',
    items: [
      { id: 49, name: 'HBO' },
      { id: 174, name: 'AMC' },
      { id: 88, name: 'FX' },
      { id: 67, name: 'Showtime' },
      { id: 318, name: 'STARZ' },
      { id: 6, name: 'NBC' },
      { id: 2, name: 'ABC' },
      { id: 16, name: 'CBS' },
      { id: 19, name: 'FOX' },
      { id: 71, name: 'The CW' },
      { id: 80, name: 'Adult Swim' },
      { id: 56, name: 'Cartoon Network' },
      { id: 47, name: 'Comedy Central' },
    ],
  },
  {
    group: 'UK',
    items: [
      { id: 4, name: 'BBC One' },
      { id: 332, name: 'BBC Two' },
      { id: 3, name: 'BBC Three' },
      { id: 26, name: 'Channel 4' },
      { id: 9, name: 'ITV1' },
    ],
  },
  {
    group: 'Asia',
    items: [
      { id: 866, name: 'tvN' },
      { id: 885, name: 'JTBC' },
      { id: 1, name: 'Fuji TV' },
      { id: 614, name: 'TOKYO MX' },
    ],
  },
]

/** Runtime presets as "min-max" (either end may be empty); movies and episodes differ. */
export const RUNTIMES: Record<MediaType, { value: string; label: string }[]> = {
  movie: [
    { value: '-90', label: 'Under 90 min' },
    { value: '90-120', label: '90–120 min' },
    { value: '120-', label: 'Over 2 hours' },
  ],
  tv: [
    { value: '-30', label: 'Under 30 min' },
    { value: '30-60', label: '30–60 min' },
    { value: '60-', label: 'Over an hour' },
  ],
}

function parseRuntime(value: string | null, type: MediaType): { min?: number; max?: number } {
  if (!value || !RUNTIMES[type].some((r) => r.value === value)) return {}
  const [min, max] = value.split('-')
  return { min: intParam(min ?? null), max: intParam(max ?? null) }
}

function parseSort(value: string | null): DiscoverSort {
  return DISCOVER_SORTS.some((s) => s.id === value) ? (value as DiscoverSort) : 'popular'
}

/** Reads discover filters from the URL. Params that don't apply to `type` are ignored. */
export function readDiscoverFilters(params: URLSearchParams, type: MediaType): DiscoverFilters {
  const runtime = parseRuntime(params.get('runtime'), type)
  const language = params.get('lang')
  return {
    genres: idListParam(params.get('genres')),
    yearFrom: intParam(params.get('from')),
    yearTo: intParam(params.get('to')),
    minRating: intParam(params.get('rating')),
    runtimeMin: runtime.min,
    runtimeMax: runtime.max,
    language: language && LANGUAGES.some((l) => l.code === language) ? language : undefined,
    sort: parseSort(params.get('sort')),
    keywords: idListParam(params.get('keywords')),
    studios: idListParam(params.get('studios')),
    network: type === 'tv' ? intParam(params.get('network')) : undefined,
  }
}
