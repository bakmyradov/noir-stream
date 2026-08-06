import type { Source } from './types'

export const SOURCES: readonly Source[] = [
  {
    id: 'videasy',
    name: 'Videasy',
    badge: '4K',
    movie: (id) => `https://player.videasy.to/movie/${id}`,
    tv: (id, s, e) => `https://player.videasy.to/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidfast',
    name: 'VidFast',
    badge: '4K',
    movie: (id) => `https://vidfast.vc/movie/${id}`,
    tv: (id, s, e) => `https://vidfast.vc/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc',
    name: 'VidSrc',
    badge: '1080p',
    movie: (id) => `https://vsembed.ru/embed/movie?tmdb=${id}`,
    tv: (id, s, e) => `https://vsembed.ru/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    id: 'vidlink',
    name: 'VidLink',
    badge: '1080p',
    movie: (id) => `https://vidlink.pro/movie/${id}`,
    tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    id: 'multiembed',
    name: 'MultiEmbed',
    badge: '1080p',
    movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
]

export const DEFAULT_SOURCE = 'videasy'

// Origins of the player iframes — used by the SW to scope its cross-origin
// navigation block so it only fires for redirects coming from a player iframe.
export const SOURCE_ORIGINS: readonly string[] = [
  'https://player.videasy.to',
  'https://vidfast.vc',
  'https://vidfast.pro',
  'https://vsembed.ru',
  'https://vidlink.pro',
  'https://multiembed.mov',
]
