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
}

export interface TVSummary {
  id: number
  media_type: 'tv'
  name: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date?: string
  vote_average?: number
}

export type MediaSummary = MovieSummary | TVSummary

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
