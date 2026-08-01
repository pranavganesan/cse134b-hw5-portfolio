# HW5 — Portfolio Site with JavaScript and Eleventy

CSE 134B, Summer I 2026. This is the HW2 portfolio evolved per HW5: a
progressive-enhancement theme picker, a custom web component backed by the
GitHub REST API, an Eleventy (11ty) build deployed from source on Netlify, and
Pagefind site search as extra credit.

## Local Setup

```
npm install       # installs Eleventy and Pagefind (devDependencies only)
npm run dev       # local dev server with live reload (alias: npm start)
npm run build     # eleventy && pagefind --site _site  →  output in _site/
```

Node 20+ recommended (declared in `netlify.toml`). `_site/` and
`node_modules/` are git-ignored; only source is committed. Netlify runs
`npm run build` on every push (command and publish directory are committed in
`netlify.toml`, not just dashboard settings).

After the first deploy, set the real site URL in two places: `site.url` in
`src/_data/site.js` (used by `sitemap.xml`) and `deployed-url.json`.

## Part 1 — Option A: Theme Picker

**No-JS baseline.** The stylesheet declares `color-scheme: light dark` on
`:root` and defines every color token with `light-dark()`, so the site fully
follows the OS `prefers-color-scheme` preference with zero JavaScript. A
`prefers-color-scheme: dark` media query is also used directly to dim bright
screenshots/video in dark mode. The picker control itself ships with the
`hidden` attribute, so with JavaScript off **there is no dead control on the
page at all** — `js/theme.js` removes `hidden` only after it has wired up the
events.

**The enhancement.** The control is a real form control: three radio buttons
(Light / Dark / System) inside a `fieldset` with a `legend`, so it is keyboard
operable and the checked radio exposes the current state to assistive
technology. On change, the module sets `data-theme="light|dark"` on `<html>`
(or removes it for System) — state the CSS already understands via
`:root[data-theme="light"] { color-scheme: light; }` and the dark equivalent.
No inline styles are ever written. The choice persists across pages and
reloads in `localStorage` under `theme-preference`.

**Flash of incorrect theme.** A deliberately tiny **inline** script in the
document head reads `localStorage` and sets `data-theme` before first paint.
This is the one exception to "all JS is external": an external or deferred
script runs after render, which is exactly what causes the flash. The snippet
is 8 lines, does nothing else, and is wrapped in try/catch.

**Storage edge cases.** Every `localStorage` read/write in both the inline
snippet and `js/theme.js` is wrapped in try/catch. If storage throws (private
mode, blocked cookies, full quota), the theme still applies for the current
page view and the site simply falls back to the OS preference on the next
load. Nothing breaks.

## Part 2 — Web Component: `<gh-activity>`

A custom element that fetches a user's most recently updated public
repositories from the **keyless, unauthenticated GitHub REST API** and renders
them as a semantic list. Written from scratch in `src/js/gh-activity.js`.

**Endpoint:** `https://api.github.com/users/{user}/repos?sort=updated&per_page={count}`
(sends usable CORS headers; no key, so no secrets in client code).

| Attribute | Default | Accepted values | Effect |
|-----------|---------|-----------------|--------|
| `user`    | `pranavganesan` | any GitHub username | which account to fetch |
| `count`   | `5`     | integer 1–10 (invalid values fall back to 5) | how many repos to show |

Both attributes are in `observedAttributes`; changing either in DevTools on
the live page aborts any in-flight request, refetches, and re-renders.

**Usage:**

```html
<gh-activity user="pranavganesan" count="5">
  <p>Fallback content shown when JavaScript is unavailable —
     link to the profile directly.</p>
</gh-activity>
```

The host page must also contain the two template elements
(`#gh-activity-template`, `#gh-repo-template`) that the component clones; see
`src/index.njk`.

**Lifecycle.** `connectedCallback` clones the shell template and starts the
first fetch; `disconnectedCallback` aborts any in-flight request via
`AbortController`; `attributeChangedCallback` refetches on real runtime
changes. Each request's signal is `AbortSignal.any([controller.signal,
AbortSignal.timeout(8000)])`, so a hanging network can never leave the widget
loading forever.

**Four states**, reflected onto the host as `data-state` so CSS can respond:
`idle` (empty result set — "no public repositories yet"), `loading` (animated
status line, `role="status"` so it's announced), `ready` (repos rendered as a
real `<ul>` of links with description, language, stars, and a `<time>`
element), and `error` (human-readable message naming the cause — timeout vs.
failure — plus a Retry button).

**Safe rendering / injection risk.** All markup comes from cloning
`<template>` elements; remote strings are only ever assigned through
`textContent` and `setAttribute`. If remote data were concatenated into an
`innerHTML` string instead, anyone able to influence that data (e.g. a repo
description containing `<img onerror=...>`) could inject markup and script
into my page — a stored XSS. `textContent` treats data as data, never markup.

**Caching and rate limits.** Responses are cached in `sessionStorage` for 10
minutes per `user`+`count` pair, so development reloads don't hammer the API
(unauthenticated limit: 60 requests/hour/IP). Cache read/write is try/catch
guarded. Attribution ("Data from the GitHub REST API") renders in the widget.

## Other JavaScript

`js/theme.js` (Part 1, above), `js/components.js` (the `<hello-world-log>`
console-only element carried forward from HW2), `js/canvas-demo.js` (the
under-15-line canvas drawing on Experiments), and `js/search.js` (extra
credit, below). All are external files under `js/`, loaded with
`type="module"` or `defer`; there are no inline event-handler attributes and
no libraries.

## Part 3 — SSG: Eleventy

I chose **Eleventy** with Nunjucks templates. Structure under `src/`:

- `_includes/layouts/base.njk` — the base layout owning the document shell:
  doctype, the head include, skip link, noscript note, and the main wrapper.
- `_includes/partials/` — three shared includes used by every page:
  `head.njk` (metadata partial: charset, viewport, per-page title/description,
  stylesheet and script references, anti-flash snippet), `header.njk` (brand +
  primary nav + theme picker), and `footer.njk` (social links, copyright).
  After conversion the footer element's opening tag appears in exactly one
  source file: that partial.
- `_data/site.js` — global data defined once: site title, author, email,
  deploy URL, current year (computed at build time), nav items, and social
  links. Templates consume these everywhere; nothing is duplicated per page.
- `_data/projects.json` — the source of truth for the project collection.
- `project.njk` — a single template that generates all three project pages
  via Eleventy pagination (`size: 1`) over `projects.json`, with per-page
  `<title>`/`<meta name="description">` supplied through `eleventyComputed`
  front matter. Adding a fourth project is one JSON entry, zero new HTML.
- Navigation state is computed at build time: `header.njk` compares each nav
  item's URL to `page.url` and emits `aria-current="page"` on the match.
- `404.njk` → generated `404.html` (Netlify serves it automatically);
  `sitemap.njk` → generated `sitemap.xml` over `collections.all`.

**Reflection.** The conversion removed the worst part of HW2: eight copies of
the same head/header/footer chrome that had already drifted (some pages had a
stale `aria-current`, and HW2's Projects pages actually shipped with the wrong
nav item highlighted — the build now computes that, so the whole class of bug
is gone). Global facts like the copyright year and my email now live in one
data file. What it cost: a Node toolchain and dependency surface for what is
still fundamentally a static site, a build step between "edit" and "see it,"
and some care to keep templates emitting valid markup (a template error can
silently break every page at once, not just one). I would not use an SSG for a
true single-page one-off (the tooling outweighs one file), for anything
needing per-user or per-request content like a dashboard or auth'd app, or
for a site edited by non-technical people who need a WYSIWYG CMS rather than
front matter in a repo.

## Extra Credit — Pagefind Search

`npm run build` is `eleventy && pagefind --site _site`: Pagefind runs after
the SSG build and indexes the generated output on every deployment (nothing is
hand-indexed or committed). Indexing is scoped with `data-pagefind-body` on
each page's main content region — header/nav and footer chrome are outside it,
so results don't match every page; the search page and 404 opt out entirely.

`/search/` is a custom UI built on the Pagefind JS API (not the bundled UI): a
real form with a labeled `input type="search"`, keyboard operable, results in
an ordered list, and a result count announced through an `aria-live="polite"`
region. Pagefind's excerpts arrive as HTML strings containing `mark`
highlight tags; rather than trusting them to `innerHTML`, `js/search.js`
splits on the mark tags and rebuilds the excerpt from text nodes and real
`<mark>` elements. Like the theme picker, the form ships `hidden` and is only
revealed once the Pagefind module actually loads; the `noscript` fallback
links to the browsable projects index and every other page.

**How Pagefind works:** at build time it crawls the rendered HTML in `_site/`
and writes a static index — a small JS loader plus a set of binary index
fragments — into `_site/pagefind/`. On this site that directory is roughly
700 KB total (8 pages, ~500 words indexed), but the browser never downloads
it all: the loader lazily fetches only the few fragments relevant to the
letters/words you type. Because the index is just static files served
alongside the site and all matching happens client-side in WebAssembly, no
search server is needed.
