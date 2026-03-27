const KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE = 'https://api.themoviedb.org/3'

async function get(path) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${BASE}${path}${sep}api_key=${KEY}`)
  if (!res.ok) throw new Error(`TMDB error ${res.status}`)
  return res.json()
}

export const IMG = {
  poster: (p) => p ? `https://image.tmdb.org/t/p/w342${p}` : null,
  backdrop: (p) => p ? `https://image.tmdb.org/t/p/w1280${p}` : null,
  still: (p) => p ? `https://image.tmdb.org/t/p/w300${p}` : null,
  thumb: (p) => p ? `https://image.tmdb.org/t/p/w92${p}` : null,
}

export async function searchMulti(query) {
  const data = await get(`/search/multi?query=${encodeURIComponent(query)}&include_adult=false`)
  return (data.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 7)
}

export async function getMovie(id) {
  return get(`/movie/${id}`)
}

export async function getTVShow(id) {
  return get(`/tv/${id}`)
}

export async function getSeason(tvId, seasonNum) {
  return get(`/tv/${tvId}/season/${seasonNum}`)
}
