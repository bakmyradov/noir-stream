export type MediaType = 'movie' | 'tv'

export interface LibraryRow {
  user_id: string
  tmdb_id: number
  media_type: MediaType
  favorited: boolean
  last_opened_at: string | null
  last_season: number | null
  last_episode: number | null
  title: string | null
  poster_path: string | null
}

export interface ProfileRow {
  id: string
  display_name: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Partial<ProfileRow> & { id: string }
        Update: Partial<ProfileRow>
      }
      library: {
        Row: LibraryRow
        Insert: Partial<LibraryRow> & {
          user_id: string
          tmdb_id: number
          media_type: MediaType
        }
        Update: Partial<LibraryRow>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
