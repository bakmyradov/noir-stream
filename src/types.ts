export type MediaType = 'movie' | 'tv'

export interface Genre {
  id: number
  name: string
}

export interface MovieSummary {
  id: number
  media_type: 'movie'
  title: string
  poster_path: string | null
  backdrop_path: string | null
  release_date?: string
  vote_average?: number
  vote_count?: number
  genre_ids?: number[]
}

export interface TVSummary {
  id: number
  media_type: 'tv'
  name: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date?: string
  vote_average?: number
  vote_count?: number
  genre_ids?: number[]
}

export type MediaSummary = MovieSummary | TVSummary

export interface PersonSummary {
  id: number
  media_type: 'person'
  name: string
  profile_path: string | null
  known_for_department?: string
  known_for?: MediaSummary[]
}

export type SearchResult = MediaSummary | PersonSummary

export interface Paged<T> {
  page: number
  total_pages: number
  total_results: number
  results: T[]
}

export interface CastMember {
  id: number
  name: string
  character?: string
  profile_path: string | null
}

export interface CrewMember {
  id: number
  name: string
  job: string
  profile_path: string | null
}

export interface Credits {
  cast: CastMember[]
  crew: CrewMember[]
}

export interface MovieDetails {
  id: number
  title: string
  overview?: string
  poster_path: string | null
  backdrop_path: string | null
  release_date?: string
  runtime?: number
  vote_average?: number
  genres?: Genre[]
  credits?: Credits
  recommendations?: MediaSummary[]
}

export interface SeasonSummary {
  id: number
  season_number: number
  name: string
  episode_count: number
}

export interface TVDetails {
  id: number
  name: string
  overview?: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date?: string
  number_of_seasons?: number
  vote_average?: number
  genres?: Genre[]
  seasons?: SeasonSummary[]
  created_by?: { id: number; name: string }[]
  credits?: Credits
  recommendations?: MediaSummary[]
}

/** One entry of a person's filmography: a title plus their role on it. */
export type PersonCredit = MediaSummary & {
  character?: string
  job?: string
  department?: string
}

export interface PersonDetails {
  id: number
  name: string
  biography?: string
  profile_path: string | null
  birthday?: string | null
  deathday?: string | null
  place_of_birth?: string | null
  known_for_department?: string
  combined_credits?: {
    cast: PersonCredit[]
    crew: PersonCredit[]
  }
}

/** A keyword or company picked as a discover filter. */
export interface NamedEntity {
  id: number
  name: string
  /** Extra text shown in pickers to tell same-named entries apart. */
  hint?: string
}

export type DiscoverSort = 'popular' | 'rating' | 'newest' | 'oldest'

export interface DiscoverFilters {
  genres: number[]
  yearFrom?: number
  yearTo?: number
  minRating?: number
  runtimeMin?: number
  runtimeMax?: number
  language?: string
  sort: DiscoverSort
  keywords: number[]
  studios: number[]
  /** TV only. */
  network?: number
}

export interface Episode {
  id: number
  episode_number: number
  season_number: number
  name: string
  still_path: string | null
  runtime?: number | null
  overview?: string
}

export interface SeasonDetails {
  id: number
  season_number: number
  episodes: Episode[]
}

export interface Source {
  id: string
  name: string
  badge: string
  movie: (id: string) => string
  tv: (id: string, season: number, episode: number) => string
}

export interface ActiveEpisode {
  season: number
  episode: number
  name: string
}
