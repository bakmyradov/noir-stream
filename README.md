# Noir

A dark, cinematic streaming front-end for movies and TV shows. Search any title, pick from multiple embed providers, and watch — installable as a PWA with a built-in ad-redirect blocker.

> **Disclaimer:** Noir is a thin metadata + iframe shell. It does not host, transcode, or distribute any video content. All playback comes from third-party embed providers; the legality of streaming via those providers depends on your jurisdiction. Use at your own risk.

## Features

- **TMDB-powered search** — instant multi-search across films and TV with debounced TMDB queries.
- **Multi-source playback** — five swappable embed providers (Videasy, VidFast, VidSrc, VidLink, MultiEmbed) with an automatic fallback if a source fails to load within 12s.
- **Episode browser** — full season/episode grid for TV shows with stills and runtimes.
- **PWA + offline shell** — installable on iOS/Android/desktop; pre-cached app shell via a custom service worker.
- **Ad-redirect blocker** — the service worker intercepts cross-origin top-level navigations originating from the player iframes, neutralizing the `window.top.location = "ad.com"` trick used by free streaming providers. Legitimate outbound links from the app itself are unaffected.

## Stack

- React 19 + React Router 7
- TypeScript (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`)
- Vite 8 + `@vitejs/plugin-react`
- Tailwind CSS v4 (via `@tailwindcss/vite`, design tokens declared with `@theme`)
- `vite-plugin-pwa` (`injectManifest` strategy, custom SW)
- Vercel Analytics + Speed Insights
- Deployed on Vercel

## Getting started

```bash
# 1. Install
npm install

# 2. Add your TMDB API key
echo 'VITE_TMDB_API_KEY=your_key_here' > .env.local

# 3. Run
npm run dev          # dev server on http://localhost:3000
```

Get a free TMDB API read key at <https://www.themoviedb.org/settings/api>.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server (port 3000, exposed on LAN) |
| `npm run build` | Type-check (`tsc -b`) then production build |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Run TypeScript in no-emit mode |
| `npm run lint` | ESLint |

## Project layout

```
src/
├── api.ts                  # TMDB client (typed, AbortSignal-aware)
├── sources.ts              # Embed provider definitions + URL builders
├── sw.ts                   # Custom service worker (cache + ad-redirect block)
├── types.ts                # TMDB + domain types
├── hooks/
│   └── useEmbedFallback.ts # 12s watchdog → auto-rotate to next source
├── components/
│   ├── SearchBar.tsx
│   ├── SourceSelector.tsx
│   ├── Topbar.tsx
│   └── LogoMark.tsx
└── pages/
    ├── Home.tsx
    ├── MoviePage.tsx
    └── TVPage.tsx
```

## Architecture notes

**Data flow.** TMDB metadata (`api.ts`) is fetched per route with `AbortController` cancellation so stale responses can't overwrite fresh ones. The user picks a title; the page renders an `<iframe>` whose `src` is built by one of the providers in `sources.ts` from the TMDB id (and season/episode for TV). Sources are interchangeable — each exports `movie(id)` and `tv(id, s, e)` URL builders.

**Ad-redirect blocker.** The custom service worker in `src/sw.ts` intercepts `fetch` events for top-level cross-origin document navigations. It only fires the block when the request's `referrer` origin is in a whitelist of known player origins, so legitimate outbound links from the app's own pages still work. When triggered, it replies with a tiny inline HTML doc that calls `history.back()` (or redirects to `/`) so the user stays on Noir.

**Source fallback.** `useEmbedFallback` starts a 12-second watchdog when an iframe is mounted; if the iframe doesn't fire `onLoad` in time (or fires `onError`) it advances to the next untried source. Manual selection via the `<SourceSelector>` clears the "tried" set so the user's choice is honoured.
