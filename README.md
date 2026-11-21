English | [简体中文](./README.zh-CN.md)

# UptimeRobot Status

A clean, DeepSeek-style status page powered by the **UptimeRobot API v3**.

The status page design references [DeepSeek Status](https://status.deepseek.com/).
This project is based on [imsyy/site-status](https://github.com/imsyy/site-status).

## Features

- **UptimeRobot API v3** — read-only Bearer key, pagination, `getMonitors` and incident history. API v2 is not supported.
- **Status dashboard** — overall status banner, per-monitor 90-day availability bars, tags and current incident details.
- **Incident calendar** — colored day markers, hover details, and a day detail modal.
- **Incident history** — a dedicated `/history` page grouped by month and date.
- **Incident detail** — deep-linkable `/incidents/:id` page with affected components, a time bar, hover tooltips and an update timeline.
- **Interactive timeline** — hover a bar to inspect a day, move the pointer to the tooltip to click through to the incident.
- **Dark / light theme**, **4 languages** (`zh-CN`, `en`, `ja-JP`, `ko-KR`), responsive layout and PWA support.
- **Optional password protection** — JWT login backed by `SITE_PASSWORD` and `SITE_SECRE_KEY`.
- **Multiple deployment targets** — Cloudflare Pages / NuxtHub, generic Node.js / Vercel / Docker, EdgeOne Makers and Alibaba Cloud ESA.

## Tech Stack

- [Nuxt 3](https://nuxt.com/) (SPA, `ssr: false`)
- Vue 3, Naive UI, Pinia
- Vue I18n
- `@nuxt/icon`, `@vite-pwa/nuxt`, `@vueuse/nuxt`
- HarmonyOS_Regular font (loaded from the Bilibili CDN)

## Requirements

- Node.js **20+** (22 recommended)
- pnpm **9+**

## Quick Start

```bash
pnpm install
cp .env.example .env
# edit .env and set at least API_KEY
pnpm dev
```

Open <http://localhost:8566/>.

Build for production:

```bash
pnpm build
```

`DEPLOYMENT_PLATFORM` selects the build target. See [Deployment](#deployment).

## Environment Variables

Copy `.env.example` to `.env` and fill in your own values. Never commit a real API key or JWT secret.

| Variable | Required | Description |
| --- | --- | --- |
| `API_URL` | No | UptimeRobot API base URL. Defaults to `https://api.uptimerobot.com/v3/`. Must be v3. |
| `API_KEY` | Yes | UptimeRobot **Read-Only** API key. It is only used on the server. |
| `DEPLOYMENT_PLATFORM` | No | `cloudflare` (default), `auto`, `eo` or `esa`. |
| `SITE_TITLE` | No | Site title shown in the header and browser tab. |
| `SITE_DESCRIPTION` | No | Site description / meta description. |
| `SITE_KEYWORDS` | No | Meta keywords. |
| `SITE_LOGO` | No | Logo path, default `/favicon.ico`. |
| `SITE_GITHUB` | No | GitHub link used in the footer / navigation. |
| `SITE_HOME` | No | Home link used in the footer. Leave empty to hide. |
| `SITE_EMAIL` | No | Email link used in the footer. A bare address gets `mailto:`. |
| `SITE_ICP` | No | ICP filing number (China). Leave empty to hide. |
| `COUNT_DAYS` | No | Number of days of daily uptime data. Default `90`; 30–90 recommended. |
| `SHOW_LINKS` | No | Show the monitor “open link” button. `true` / `false`. |
| `SITE_PASSWORD` | No | Optional site password. Must be used together with `SITE_SECRE_KEY`. |
| `SITE_SECRE_KEY` | No | JWT signing secret. The historical typo `SECRE` is intentional. |

Notes:

- `API_KEY` must be a **Read-Only** key from <https://dashboard.uptimerobot.com/integrations>. Do not use the Main API key.
- `SITE_PASSWORD` and `SITE_SECRE_KEY` must both be set to enable password protection. Generate a secret with `openssl rand -hex 32`.
- EdgeOne environment variables cannot contain spaces. In text values use `+` instead of spaces, e.g. `SITE_TITLE="Huoiop+NET+Status"`.
- The copyright author is fixed to **Huoiop** (<https://github.com/Huoiop/>). `SITE_AUTHOR` and `SITE_AUTHOR_URL` are no longer used.

## Routes

| Route | Description |
| --- | --- |
| `/` | Status dashboard: overall banner, system status, bars, calendar. |
| `/history` | Incident history grouped by month and date. |
| `/incidents/:id` | Incident detail with affected components and update timeline. |

The app is an SPA with server API routes. It is **not** a purely static site: `/api/*` and deep links to `/history` and `/incidents/*` need the Nitro server / Worker runtime.

## How It Works

- `server/api/getMonitors` calls UptimeRobot v3 `GET /monitors` and `GET /incidents` with `Authorization: Bearer <API_KEY>`.
- Daily availability is derived from `Downtime` incidents, because v3 no longer provides v2-style `custom_uptime_ranges`; the v3 `CUSTOM` stats timeframe requires a paid plan.
- Days before a monitor was created are shown as “no data”.
- Responses are cached server-side for 60 seconds. The UI refreshes automatically every 5 minutes and provides a manual refresh button.
- UptimeRobot Free plans are limited to 10 requests/minute. A cache miss normally makes two upstream requests (`/monitors` and `/incidents`).

## Deployment

### Cloudflare Pages / NuxtHub (default)

```bash
DEPLOYMENT_PLATFORM=cloudflare pnpm run build
```

- Output: `dist/` (`dist/_worker.js/index.js` for the Worker).
- Configure `API_KEY` and the other variables in the Cloudflare / NuxtHub project settings.
- `DEPLOYMENT_PLATFORM=cloudflare` is the default when the variable is unset.

### Generic Node.js / Vercel / Docker

```bash
DEPLOYMENT_PLATFORM=auto pnpm run build
node .output/server/index.mjs
```

- Output: `.output/`.
- Set `API_KEY` (and other variables) in the platform environment.
- A Node runtime can also override the API settings with `NUXT_API_KEY` and `NUXT_API_URL` without rebuilding.

### EdgeOne Makers

```bash
DEPLOYMENT_PLATFORM=eo pnpm run build
```

- Node.js 22.x.
- Output directory: `.edgeone/` (`cloud-functions/ssr-node/handler.js` + `config.json`).
- Build command: `pnpm run build`.
- Set `DEPLOYMENT_PLATFORM=eo`, `API_KEY` and the other variables in the EdgeOne console.
- EdgeOne environment values cannot contain spaces; use `+` in text values. Changes to environment variables take effect on the next deployment.

### Alibaba Cloud ESA

```bash
DEPLOYMENT_PLATFORM=esa pnpm run build
```

- Output: `.output/server/index.mjs` (Worker) and `.output/public/` (static assets).
- Static asset directory: `.output/public`.
- Function entry: `.output/server/index.mjs`.
- Do **not** configure `notFoundStrategy: singlePageApplication`: the Nitro function handles SPA routes and API requests. Using a static-only fallback will break `/history`, `/incidents/*` and `/api/*`.

## Security

- The repository is public. Never commit `.env` or any real API key / JWT secret.
- `.env.example` contains placeholders only. If a real key is ever exposed, rotate it in the UptimeRobot dashboard.
- The API key is read-only and is only used by the server-side API route.
- Password protection is optional, but recommended if the monitor data should not be public.
- Deploying a new version may leave an old Service Worker cached. Hard-refresh or clear site data if the UI still looks stale.

## Credits

- [DeepSeek Status](https://status.deepseek.com/) — the status page design this project references
- [imsyy/site-status](https://github.com/imsyy/site-status) — the status page project this project is based on
- [uptime-status](https://github.com/yb/uptime-status) — inspiration
- [UptimeRobot](https://uptimerobot.com/) — monitoring API
- HarmonyOS_Regular font served by the Bilibili CDN

## License

[MIT](./LICENSE)

## Author

[Huoiop](https://github.com/Huoiop/)
