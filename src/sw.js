// Precache manifest injected by vite-plugin-pwa
const CACHE = 'noir-v1'
const MANIFEST = self.__WB_MANIFEST || []

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(MANIFEST.map(e => e.url)))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  // Remove old caches
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Block external navigations — prevents ad redirects injected by streaming iframes.
  // When an iframe does window.top.location = "https://ad.com", the browser fires a
  // navigate request for the top-level document which this handler intercepts.
  if (event.request.mode === 'navigate' && url.origin !== self.location.origin) {
    event.respondWith(
      new Response(
        '<!DOCTYPE html><script>history.length>1?history.go(-1):location.replace("/")</script>',
        { headers: { 'Content-Type': 'text/html' } }
      )
    )
    return
  }

  // Serve cached assets, fall back to network
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  )
})
