English | [简体中文](./README.zh-CN.md)

<div align="center">
<h1>HuoiopStatus</h1>
<p>A DeepSeek-style status page powered by UptimeRobot API v3</p>
<br />
<img src="https://img.shields.io/github/last-commit/Huoiop/uptimerobot-status" alt="last commit"/>
<img src="https://img.shields.io/github/languages/code-size/Huoiop/uptimerobot-status" alt="code size"/>
<img src="https://img.shields.io/github/stars/Huoiop/uptimerobot-status?style=full" alt="GitHub stars"/>
<img src="https://img.shields.io/github/forks/Huoiop/uptimerobot-status?style=full&color=orange" alt="GitHub forks"/>
</div>

## ✨ About

A status page powered by the **UptimeRobot API v3**.

- The UI and interactions reference [DeepSeek Status](https://status.deepseek.com/)
- This project is based on [imsyy/site-status](https://github.com/imsyy/site-status)
- Fully adapted to UptimeRobot v3; the legacy v2 API is not supported

## 🎉 Features

- 🌍 Multiple deployment targets (Cloudflare, Vercel, Node, EdgeOne, ESA)
- ✨ DeepSeek-style status page: status banner, system status, incident calendar
- 📊 90-day daily availability bars for every monitor
- 📅 Calendar with hover previews and a day detail modal
- 📝 Dedicated incident history and deep-linkable incident detail pages
- 🏷️ Monitor tags displayed everywhere the monitor appears
- 🖱️ Hover tooltips on bars, calendar days and the affected-component timeline
- 🌙 Dark / light theme and 4 languages (Simplified Chinese, English, Japanese, Korean)
- 🔐 Optional password protection (JWT + Hash)
- ⏲️ Server-side cache and automatic frontend refresh
- 📱 Mobile-friendly layout and PWA support

## 🧱 Tech Stack

- [Nuxt 3](https://nuxt.com/) (SPA, `ssr: false`)
- Vue 3, Naive UI, Pinia
- Vue I18n
- `@nuxt/icon`, `@vite-pwa/nuxt`, `@vueuse/nuxt`
- HarmonyOS_Regular font (served by the Bilibili CDN)

## 📄 Pages and Routes

| Route | Description |
| --- | --- |
| `/` | Dashboard: overall status, system status, 90-day bars and calendar |
| `/history` | Incident history grouped by month and date |
| `/incidents/:id` | Incident detail with affected components and update timeline |

> This is an SPA with server API routes and **cannot be deployed as a purely static site**.
> `/api/*`, `/history` and `/incidents/*` all require the Nitro server / Worker runtime.

## 🚀 Quick Start

Requirements:

- Node.js **20+** (22.x recommended)
- pnpm **9+**

```bash
# Install dependencies
pnpm install

# Copy the environment template
cp .env.example .env

# Edit .env and set at least API_KEY
# API_KEY must be an UptimeRobot Read-Only API key

# Start the dev server
pnpm dev
```

Open <http://localhost:8566/>.

Production build:

```bash
pnpm build
```

`DEPLOYMENT_PLATFORM` controls the build target. See [Deployment](#-deployment).

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your own values. **Never commit a real API key or JWT secret.**

| Variable | Required | Description |
| --- | --- | --- |
| `API_URL` | No | UptimeRobot API base URL. Defaults to `https://api.uptimerobot.com/v3/`. Must be v3. |
| `API_KEY` | Yes | UptimeRobot Read-Only API key. Used only on the server. |
| `DEPLOYMENT_PLATFORM` | No | `cloudflare` (default), `auto`, `eo` or `esa`. |
| `SITE_TITLE` | No | Site title. |
| `SITE_DESCRIPTION` | No | Site description / meta description. |
| `SITE_KEYWORDS` | No | Meta keywords. |
| `SITE_LOGO` | No | Logo path, default `/favicon.ico`. |
| `SITE_GITHUB` | No | Footer GitHub button link. |
| `SITE_HOME` | No | Footer home button link. Leave empty to hide. |
| `SITE_EMAIL` | No | Footer email button; a bare address gets `mailto:`. |
| `SITE_ICP` | No | ICP filing number. Leave empty to hide. |
| `COUNT_DAYS` | No | Days of daily availability data. Default `90`; 30–90 recommended. |
| `SHOW_LINKS` | No | Show the monitor “open link” button. `true` / `false`. |
| `SITE_PASSWORD` | No | Optional site password. |
| `SITE_SECRE_KEY` | No | JWT signing secret. The historical `SECRE` typo is intentional. |

Notes:

- `API_KEY` must be a **Read-Only** key from the [UptimeRobot integrations page](https://dashboard.uptimerobot.com/integrations). Do not use the Main API key.
- `SITE_PASSWORD` and `SITE_SECRE_KEY` must both be set to enable password protection. Generate a secret with `openssl rand -hex 32`.
- EdgeOne environment values cannot contain spaces. Use `+` in text values, e.g. `SITE_TITLE="Huoiop+NET+Status"`.
- The copyright author is fixed to **Huoiop** (<https://github.com/Huoiop/>). `SITE_AUTHOR` and `SITE_AUTHOR_URL` are no longer used.

## 🧩 How Data Works

- The server calls UptimeRobot v3 `GET /monitors` and `GET /incidents` with
  `Authorization: Bearer <API_KEY>`.
- v3 no longer provides v2-style `custom_uptime_ranges`, and the `CUSTOM` stats
  timeframe requires a paid plan. Daily availability is therefore derived from
  `Downtime` incidents day by day.
- Dates before a monitor was created are shown as “no data”.
- Responses are cached server-side for 60 seconds. The UI refreshes every 5 minutes
  and also provides a manual refresh button.
- UptimeRobot Free plans are limited to 10 requests/minute. A cache miss normally
  makes two upstream requests.

## 🌍 Deployment

### Build targets

`DEPLOYMENT_PLATFORM` controls the build output:

| Value | Target | Output |
| --- | --- | --- |
| `cloudflare` (default) | Cloudflare Pages / NuxtHub | `dist/` |
| `auto` | Generic Node.js server | `.output/` |
| `eo` | EdgeOne Makers | `.edgeone/` |
| `esa` | Alibaba Cloud ESA | `.output/server/index.mjs` + `.output/public/` |

### Cloudflare

This project is deployed by default with [Cloudflare Pages](https://pages.cloudflare.com/).

- You can use [NuxtHub](https://hub.nuxt.com/) for a quick deployment, or connect the repository in Cloudflare Pages manually.
- Configure the environment variables before deploying; see `.env.example`. `API_KEY` is required.
- If everything goes well, the status page is ready.

| Setting | Value |
| --- | --- |
| Build command | `pnpm run build` |
| Environment variables | `DEPLOYMENT_PLATFORM=cloudflare`, `API_KEY`, etc. |
| Output directory | `dist/` |

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Huoiop/uptimerobot-status)

- Click the button above to deploy.
- Add the following environment variables (important):

| Variable | Value |
| --- | --- |
| `DEPLOYMENT_PLATFORM` | `auto` |
| `API_KEY` | Your UptimeRobot Read-Only API key |
| `API_URL` | `https://api.uptimerobot.com/v3/` (optional) |

See `.env.example` for the other site variables.

### EdgeOne Makers

Set `DEPLOYMENT_PLATFORM=eo`. The build runs `@edgeone/nuxt-pages` and emits the EdgeOne Build Output API structure into `.edgeone`.

| Setting | Value |
| --- | --- |
| Root directory | `./` |
| Install command | `pnpm install` |
| Build command | `pnpm run build` |
| Output directory | `.edgeone` |
| Node.js version | 22.x |

Add `DEPLOYMENT_PLATFORM=eo`, `API_KEY` and the other variables from `.env.example` in the EdgeOne project settings, then deploy.

> EdgeOne environment variable values cannot contain spaces. In text fields (`SITE_TITLE`, `SITE_DESCRIPTION`, `SITE_KEYWORDS`, `SITE_ICP`), use `+` as a space placeholder, e.g. `SITE_TITLE="Huoiop+NET+Status"`.

### Alibaba Cloud ESA

Set `DEPLOYMENT_PLATFORM=esa`. The build uses Nitro's `cloudflare-module` preset and produces an edge Worker.

| Setting | Value |
| --- | --- |
| Root directory | `/` |
| Install command | `pnpm install` |
| Build command | `pnpm run build` |
| Static assets directory | `.output/public` |
| Function file path | `.output/server/index.mjs` |
| Node.js version | 22.x |

Add `DEPLOYMENT_PLATFORM=esa`, `API_KEY` and the other variables from `.env.example` in the ESA project settings.

You can also configure the same values with an `esa.jsonc` in the repository root:

```jsonc
{
  "name": "uptimerobot-status",
  "entry": "./.output/server/index.mjs",
  "installCommand": "pnpm install",
  "buildCommand": "pnpm run build",
  "assets": {
    "directory": ".output/public"
  }
}
```

> When `esa.jsonc` exists, its settings take precedence over the ESA console build configuration.
>
> Do **not** configure `notFoundStrategy: singlePageApplication`: Nitro handles SPA
> routes and API requests. A static-only fallback breaks `/history`, `/incidents/*`
> and `/api/*`.

### Other Hosting Platforms

For deployment guides, refer to the official documentation: [Deploying Nuxt Apps](https://nuxtjs.org.cn/deploy)

## ❓ Q & A

### How to enable site encryption

Add `SITE_PASSWORD` and `SITE_SECRE_KEY` to the environment variables. Both are required.
`SITE_PASSWORD` is the site password, and `SITE_SECRE_KEY` is the JWT signing secret.

### How to customize footer links

Use `SITE_GITHUB`, `SITE_HOME` and `SITE_EMAIL`. See `.env.example`.

The copyright line always shows `Huoiop` (linking to <https://github.com/Huoiop/>).
The author is fixed and is no longer configured through environment variables.

### Where does the daily availability come from

UptimeRobot v3 no longer provides v2's `custom_uptime_ranges`. This project fetches
`Downtime` incidents and calculates downtime and availability per day. Dates before
a monitor was created are shown as “no data”.

### The page still looks old after deployment

The browser may still cache an old Service Worker. Hard-refresh the page or clear
site data for the site.

### Can it be deployed as a purely static site

No. `/api/*` needs a server runtime, and `/history` and `/incidents/*` need SPA
routing. Use Node, Cloudflare Workers, EdgeOne, ESA or another platform with a
server runtime.

## 🙏 Thanks

- [DeepSeek Status](https://status.deepseek.com/) — the status page design this project references
- [imsyy/site-status](https://github.com/imsyy/site-status) — the status page project this project is based on
- [uptime-status](https://github.com/yb/uptime-status) — inspiration
- [UptimeRobot](https://uptimerobot.com/) — monitoring API
- HarmonyOS_Regular font served by the Bilibili CDN

## 📄 License

[MIT](./LICENSE)

## 👤 Author

[Huoiop](https://github.com/Huoiop/)
