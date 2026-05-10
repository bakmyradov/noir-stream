/// <reference lib="webworker" />
import { SOURCE_ORIGINS } from './sources'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: { url: string }[]
}

const CACHE = 'noir-v1'
const MANIFEST = self.__WB_MANIFEST ?? []

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(MANIFEST.map((e) => e.url)))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

// Origins we know host third-party players. Cross-origin top-level navigations
// whose referrer is one of these are almost certainly ad redirects fired by
// `window.top.location = ...` inside the embedded iframe.
const PLAYER_ORIGIN_SET = new Set<string>(SOURCE_ORIGINS)

function isPlayerReferrer(referrer: string): boolean {
  if (!referrer) return false
  try {
    return PLAYER_ORIGIN_SET.has(new URL(referrer).origin)
  } catch {
    return false
  }
}

// Network-first for HTML so users get fresh markup on every navigation, with
// the cached shell as offline fallback.
async function networkFirst(req: Request): Promise<Response> {
  try {
    const fresh = await fetch(req)
    if (fresh.ok) {
      const cache = await caches.open(CACHE)
      cache.put(req, fresh.clone()).catch(() => {})
    }
    return fresh
  } catch {
    const cached = await caches.match(req)
    if (cached) return cached
    const shell = await caches.match('/index.html')
    if (shell) return shell
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
  }
}

// Stale-while-revalidate for static same-origin assets: serve cached
// instantly, refresh the cache entry in the background.
async function staleWhileRevalidate(req: Request): Promise<Response> {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(req)
  const network = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone()).catch(() => {})
      return res
    })
    .catch(() => null)
  return cached ?? (await network) ?? new Response('Offline', { status: 503 })
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Only block top-level cross-origin navigations whose referrer is a known
  // player iframe origin. This avoids breaking legitimate outbound links that
  // may be added later (their referrer would be the app's own origin).
  if (
    req.mode === 'navigate' &&
    req.destination === 'document' &&
    url.origin !== self.location.origin &&
    isPlayerReferrer(req.referrer)
  ) {
    event.respondWith(
      new Response(
        '<!DOCTYPE html><script>history.length>1?history.go(-1):location.replace("/")</script>',
        { headers: { 'Content-Type': 'text/html' } },
      ),
    )
    return
  }

  if (req.method !== 'GET' || url.origin !== self.location.origin) return

  // Top-level navigations and explicit HTML requests use network-first.
  const isHtmlNav =
    req.mode === 'navigate' ||
    req.destination === 'document' ||
    req.headers.get('accept')?.includes('text/html')

  if (isHtmlNav) {
    event.respondWith(networkFirst(req))
    return
  }

  event.respondWith(staleWhileRevalidate(req))
})
