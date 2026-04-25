# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Vite dev server on port 3000 (host: true, exposed on LAN)
pnpm build      # Production build to dist/
pnpm preview    # Preview production build
pnpm lint       # ESLint over the repo
```

Requires `VITE_TMDB_API_KEY` in env (read by [src/api.js](src/api.js)).

## Architecture

Single-page React 19 app (JS, not TS) that streams movies/TV by embedding third-party player iframes. Branded as "Noir".

**Data flow:** TMDB API ([src/api.js](src/api.js)) supplies metadata (search, movie/tv/season details, trending). The user picks a title; the page renders an `<iframe>` whose `src` is built by one of the providers in [src/sources.js](src/sources.js) keyed by TMDB id (and season/episode for TV). Sources are interchangeable — each exports `movie(id)` and `tv(id, s, e)` URL builders. `DEFAULT_SOURCE` controls the initial pick.

**Routing:** [src/App.jsx](src/App.jsx) uses `react-router-dom` v7 with three routes: `/`, `/movie/:id`, `/tv/:id`. Pages live in [src/pages/](src/pages/); shared components in [src/components/](src/components/).

**PWA + ad-redirect blocker:** [src/sw.js](src/sw.js) is a custom service worker registered via `vite-plugin-pwa` in `injectManifest` strategy ([vite.config.js](vite.config.js)). Beyond standard precache/cache-fallback, its `fetch` handler intercepts top-level `navigate` requests to cross-origin URLs and replaces them with an inline HTML doc that calls `history.back()` / redirects to `/`. This neutralizes ad redirects injected by streaming iframes (`window.top.location = ...`). When touching iframe behavior, sandboxing, or navigation flows, keep this handler in mind — a previous iteration used iframe `sandbox` attributes and was replaced by this SW approach (commit e54e98d).

**Build/deploy:** Vercel (see [vercel.json](vercel.json)), with `@vercel/analytics` and `@vercel/speed-insights` wired in.

## Notes

- The repo-root [/Users/batyrakmyradov/CLAUDE.md](../../CLAUDE.md) describes a different project (Tuum monorepo) and does **not** apply here — this project is a plain Vite + React app, no NX, no TypeScript, no Tanstack Query.
- PWA assets are generated via `@vite-pwa/assets-generator` (no script wired in package.json; run via `pnpm exec pwa-assets-generator` if regenerating icons).
