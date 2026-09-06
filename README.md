# Rootwork

Rootwork is a local-first weekly execution app. The product model is deliberately simple:

```text
Goal → Weekly task
```

The primary surfaces are Dashboard, Weekly goals, Calendar, Progress, and Add. Dashboard tracks weekly completion and execution pace. Goals contain weekly tasks directly. Calendar is a square month grid over the same dated tasks. Progress summarizes execution rather than adding another planning layer.

## Runtime

- `index.html` — light-only PWA shell and first splash frame
- `app.js` — React UI and interaction
- `domain.js` — dates, week lifecycle, metrics, XP and business rules
- `store.js` — localStorage, migration and backup
- `styles.css` — the complete visual system and launch motion
- `sw.js` — offline shell
- `brand/rootwork-logo.png` — the single canonical raster brand asset

There is no account, server, analytics or tracking. User data stays in this browser's localStorage. Existing schema migrations and backup compatibility remain in `store.js`.

## Brand and launch

Rootwork uses one raster logo asset only. The splash renders that real `<img>` immediately, then applies a short scale/fade/halo transition before entering the app. The wordmark is text so it stays sharp at every density. The interface is light-only and uses Open Sans with system fallbacks.

## Run

```sh
python -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

## Tests

```sh
node tests/run-tests.js
```

## Deployment

Deploy the repository root to any static HTTPS host. The service worker caches the current shell and removes previous cache versions on activation. Before clearing browser data or changing domains, export a backup from Settings & data.