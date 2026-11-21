[English](./README.md) | 简体中文

# UptimeRobot Status

基于 **UptimeRobot API v3** 的 DeepSeek 风格在线状态页。

状态页设计参考了 [DeepSeek 状态页](https://status.deepseek.com/)；
本项目基于 [imsyy/site-status](https://github.com/imsyy/site-status)。

## 特色

- **UptimeRobot API v3** — 使用 Read-Only Key + Bearer 鉴权，支持分页、监控项和故障历史；不再支持 v2。
- **状态面板** — 整体状态横幅、每个监控项的 90 天可用率柱状图、标签和当前故障信息。
- **事件日历** — 故障日期高亮、悬浮详情和日期详情弹窗。
- **历史事件页** — 独立 `/history` 页面，按月份和日期分组。
- **故障详情页** — 可直接访问的 `/incidents/:id`，包含受影响组件、时间条、悬浮提示和更新记录。
- **交互时间线** — 柱状条悬浮查看当天状态，鼠标可移入提示框并点击进入故障详情。
- **深浅色主题**、**四种语言**（`zh-CN`、`en`、`ja-JP`、`ko-KR`）、移动端适配和 PWA。
- **可选密码保护** — 基于 `SITE_PASSWORD` 和 `SITE_SECRE_KEY` 的 JWT 登录。
- **多平台部署** — Cloudflare Pages / NuxtHub、通用 Node.js / Vercel / Docker、EdgeOne Makers、阿里云 ESA。

## 技术栈

- [Nuxt 3](https://nuxt.com/)（SPA，`ssr: false`）
- Vue 3、Naive UI、Pinia
- Vue I18n
- `@nuxt/icon`、`@vite-pwa/nuxt`、`@vueuse/nuxt`
- HarmonyOS_Regular 字体（由 B 站 CDN 提供）

## 环境要求

- Node.js **20+**（推荐 22）
- pnpm **9+**

## 快速开始

```bash
pnpm install
cp .env.example .env
# 编辑 .env，至少填写 API_KEY
pnpm dev
```

打开 <http://localhost:8566/>。

生产构建：

```bash
pnpm build
```

`DEPLOYMENT_PLATFORM` 决定构建目标，详见[部署](#部署)。

## 环境变量

把 `.env.example` 复制为 `.env` 并填写自己的值。**不要把真实的 API Key 或 JWT 密钥提交到仓库。**

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `API_URL` | 否 | UptimeRobot API 地址，默认 `https://api.uptimerobot.com/v3/`，必须是 v3。 |
| `API_KEY` | 是 | UptimeRobot **Read-Only** API Key，只在服务端使用。 |
| `DEPLOYMENT_PLATFORM` | 否 | `cloudflare`（默认）、`auto`、`eo` 或 `esa`。 |
| `SITE_TITLE` | 否 | 站点标题，用于页面顶部和浏览器标签。 |
| `SITE_DESCRIPTION` | 否 | 站点描述 / meta description。 |
| `SITE_KEYWORDS` | 否 | meta keywords。 |
| `SITE_LOGO` | 否 | 站点图标路径，默认 `/favicon.ico`。 |
| `SITE_GITHUB` | 否 | 页脚 / 导航中的 GitHub 链接。 |
| `SITE_HOME` | 否 | 页脚主页链接，留空隐藏。 |
| `SITE_EMAIL` | 否 | 页脚邮箱链接；裸邮箱会自动补 `mailto:`。 |
| `SITE_ICP` | 否 | ICP 备案号（中国大陆），留空隐藏。 |
| `COUNT_DAYS` | 否 | 每日可用率统计天数，默认 `90`，建议 30–90。 |
| `SHOW_LINKS` | 否 | 是否显示监控项的“打开链接”按钮，`true` / `false`。 |
| `SITE_PASSWORD` | 否 | 可选的站点访问密码，必须和 `SITE_SECRE_KEY` 同时设置。 |
| `SITE_SECRE_KEY` | 否 | JWT 签名密钥；变量名中的 `SECRE` 是历史拼写，保持原样。 |

说明：

- `API_KEY` 必须是 <https://dashboard.uptimerobot.com/integrations> 中的 **Read-Only API Key**，不要使用 Main API Key。
- 启用密码保护时必须同时设置 `SITE_PASSWORD` 和 `SITE_SECRE_KEY`。可以用 `openssl rand -hex 32` 生成密钥。
- EdgeOne 的环境变量不能包含空格。文本值请用 `+` 代替空格，例如 `SITE_TITLE="Huoiop+NET+Status"`。
- 版权作者固定为 **Huoiop**（<https://github.com/Huoiop/>），不再使用 `SITE_AUTHOR` / `SITE_AUTHOR_URL`。

## 路由

| 路由 | 说明 |
| --- | --- |
| `/` | 状态面板：状态横幅、系统状态、柱状图、事件日历。 |
| `/history` | 历史事件，按月份和日期分组。 |
| `/incidents/:id` | 故障详情，包含受影响组件和更新记录。 |

本项目是带服务端 API 的 SPA，**不能当纯静态站部署**：`/api/*` 以及 `/history`、`/incidents/*` 深链接都需要 Nitro 服务端 / Worker 运行时。

## 实现说明

- `server/api/getMonitors` 使用 `Authorization: Bearer <API_KEY>` 调用 UptimeRobot v3 的 `GET /monitors` 和 `GET /incidents`。
- v3 没有 v2 的 `custom_uptime_ranges`，且 `CUSTOM` 统计时间范围需要付费订阅，因此每日可用率由 `Downtime` incidents 按天计算。
- 监控项创建前的日期显示为“无数据”。
- 服务端缓存 60 秒；前端每 5 分钟自动刷新，也可以手动刷新。
- UptimeRobot Free 套餐限流 10 次/分钟。一次缓存未命中通常会发起两个上游请求（`/monitors` 和 `/incidents`）。

## 部署

### Cloudflare Pages / NuxtHub（默认）

```bash
DEPLOYMENT_PLATFORM=cloudflare pnpm run build
```

- 产物：`dist/`（Worker 入口 `dist/_worker.js/index.js`）。
- 在 Cloudflare / NuxtHub 项目设置中配置 `API_KEY` 等变量。
- 未设置 `DEPLOYMENT_PLATFORM` 时默认使用该模式。

### 通用 Node.js / Vercel / Docker

```bash
DEPLOYMENT_PLATFORM=auto pnpm run build
node .output/server/index.mjs
```

- 产物：`.output/`。
- 在平台环境变量中配置 `API_KEY` 等。
- Node 运行时也可以用 `NUXT_API_KEY`、`NUXT_API_URL` 覆盖 API 配置，无需重新构建。

### EdgeOne Makers

```bash
DEPLOYMENT_PLATFORM=eo pnpm run build
```

- Node.js 22.x。
- 输出目录：`.edgeone/`（`cloud-functions/ssr-node/handler.js` + `config.json`）。
- 构建命令：`pnpm run build`。
- 在 EdgeOne 控制台配置 `DEPLOYMENT_PLATFORM=eo`、`API_KEY` 等变量。
- EdgeOne 环境变量不能包含空格；文本值用 `+` 代替空格。环境变量修改只对下一次部署生效。

### 阿里云 ESA

```bash
DEPLOYMENT_PLATFORM=esa pnpm run build
```

- 产物：`.output/server/index.mjs`（Worker）和 `.output/public/`（静态资源）。
- 静态资源目录：`.output/public`。
- 函数入口：`.output/server/index.mjs`。
- **不要**配置 `notFoundStrategy: singlePageApplication`：SPA 路由和 API 请求由 Nitro 函数处理，纯静态回退会导致 `/history`、`/incidents/*` 和 `/api/*` 失效。

## 安全

- 仓库是公开的，**不要提交 `.env`、真实 API Key 或 JWT 密钥**。
- 仓库中的 `.env.example` 只包含占位符。如果真实密钥曾经泄露，请到 UptimeRobot 控制台轮换。
- API Key 是只读的，并且只在服务端 API 路由中使用。
- 如果监控数据不应公开，建议启用站点密码。
- 重新部署后浏览器可能仍缓存旧 Service Worker；如果页面没有更新，请强制刷新或清除站点数据。

## 鸣谢

- [DeepSeek 状态页](https://status.deepseek.com/) — 状态页设计参考
- [imsyy/site-status](https://github.com/imsyy/site-status) — 本项目基于此状态页
- [uptime-status](https://github.com/yb/uptime-status) — 项目灵感
- [UptimeRobot](https://uptimerobot.com/) — 监控 API
- HarmonyOS_Regular 字体由 B 站 CDN 提供

## 许可证

[MIT](./LICENSE)

## 作者

[Huoiop](https://github.com/Huoiop/)
