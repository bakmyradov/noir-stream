import type { Source } from './types'

export const SOURCES: readonly Source[] = [
  {
    id: 'videasy',
    name: 'Videasy',
    badge: '4K',
    movie: (id) => `https://player.videasy.net/movie/${id}`,
    tv: (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidfast',
    name: 'VidFast',
    badge: '4K',
    movie: (id) => `https://vidfast.pro/movie/${id}`,
    tv: (id, s, e) => `https://vidfast.pro/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc',
    name: 'VidSrc',
    badge: '1080p',
    movie: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
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
  'https://player.videasy.net',
  'https://vidfast.pro',
  'https://vidsrc.cc',
  'https://vidlink.pro',
  'https://multiembed.mov',
]
