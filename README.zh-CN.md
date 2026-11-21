简体中文 | [English](./README.md)

<div align="center">
<h1>HuoiopStatus</h1>
<p>一个基于 UptimeRobot API v3 的 DeepSeek 风格在线状态页</p>
<br />
<img src="https://img.shields.io/github/last-commit/Huoiop/uptimerobot-status" alt="last commit"/>
<img src="https://img.shields.io/github/languages/code-size/Huoiop/uptimerobot-status" alt="code size"/>
<img src="https://img.shields.io/github/stars/Huoiop/uptimerobot-status?style=full" alt="GitHub stars"/>
<img src="https://img.shields.io/github/forks/Huoiop/uptimerobot-status?style=full&color=orange" alt="GitHub forks"/>
</div>

## ✨ 项目说明

这是一个基于 **UptimeRobot API v3** 的在线状态页。

- 状态页的视觉和交互参考了 [DeepSeek 状态页](https://status.deepseek.com/)
- 项目基于 [imsyy/site-status](https://github.com/imsyy/site-status) 改造
- 已完整适配 UptimeRobot v3，旧版 v2 API 不再支持

## 🎉 特色

- 🌍 多平台部署支持（Cloudflare、Vercel、Node、EdgeOne、ESA）
- ✨ DeepSeek 风格状态页：状态横幅、系统状态、事件日历
- 📊 每个监控项展示最近 90 天每日可用率条形图
- 📅 事件日历支持日期悬浮预览、点击查看当天故障
- 📝 独立的历史事件页和故障详情页，支持直接访问链接
- 🏷️ 监控项标签在所有相关位置展示
- 🖱️ 立柱、日历、故障长条均有悬浮提示
- 🌙 深浅色主题、简体中文 / English / 日本語 / 한국어
- 🔐 支持站点密码加密（JWT + Hash）
- ⏲️ 服务端缓存 + 前端定时刷新
- 📱 移动端适配、PWA 支持

## 🧱 技术栈

- [Nuxt 3](https://nuxt.com/)（SPA，`ssr: false`）
- Vue 3、Naive UI、Pinia
- Vue I18n
- `@nuxt/icon`、`@vite-pwa/nuxt`、`@vueuse/nuxt`
- HarmonyOS_Regular 字体（B 站 CDN）

## 📄 页面与路由

| 路由 | 说明 |
| --- | --- |
| `/` | 状态页：整体状态、系统状态、90 天可用率、事件日历 |
| `/history` | 历史事件：按月份和日期分组 |
| `/incidents/:id` | 故障详情：受影响组件、时间条、更新记录 |

> 本项目是带服务端 API 的 SPA，**不能当纯静态站部署**。`/api/*` 以及
> `/history`、`/incidents/*` 深链接都需要 Nitro 服务端 / Worker 运行时。

## 🚀 快速开始

环境要求：

- Node.js **20+**（推荐 22.x）
- pnpm **9+**

```bash
# 安装依赖
pnpm install

# 复制环境变量模板
cp .env.example .env

# 编辑 .env，至少填写 API_KEY
# API_KEY 需要是 UptimeRobot 的 Read-Only API Key

# 启动开发服务器
pnpm dev
```

打开 <http://localhost:8566/>。

生产构建：

```bash
pnpm build
```

`DEPLOYMENT_PLATFORM` 决定构建目标，详见下方[部署](#-部署)。

## ⚙️ 环境变量

把 `.env.example` 复制为 `.env` 并填写自己的值。**不要提交真实 API Key 或 JWT 密钥。**

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `API_URL` | 否 | UptimeRobot API 地址，默认 `https://api.uptimerobot.com/v3/`，必须是 v3 |
| `API_KEY` | 是 | UptimeRobot Read-Only API Key，只在服务端使用 |
| `DEPLOYMENT_PLATFORM` | 否 | `cloudflare`（默认）/ `auto` / `eo` / `esa` |
| `SITE_TITLE` | 否 | 站点标题 |
| `SITE_DESCRIPTION` | 否 | 站点描述 / meta description |
| `SITE_KEYWORDS` | 否 | meta keywords |
| `SITE_LOGO` | 否 | 站点图标路径，默认 `/favicon.ico` |
| `SITE_GITHUB` | 否 | 页脚 GitHub 按钮链接 |
| `SITE_HOME` | 否 | 页脚主页按钮链接，留空隐藏 |
| `SITE_EMAIL` | 否 | 页脚邮箱按钮；裸邮箱自动补 `mailto:` |
| `SITE_ICP` | 否 | ICP 备案号，留空隐藏 |
| `COUNT_DAYS` | 否 | 每日可用率统计天数，默认 `90`，建议 30–90 |
| `SHOW_LINKS` | 否 | 是否显示监控项的“打开链接”按钮，`true` / `false` |
| `SITE_PASSWORD` | 否 | 可选的站点访问密码 |
| `SITE_SECRE_KEY` | 否 | JWT 签名密钥；变量名中的 `SECRE` 是历史拼写，保持原样 |

说明：

- `API_KEY` 必须是 [UptimeRobot API 管理](https://dashboard.uptimerobot.com/integrations) 中的 **Read-Only API Key**，不要使用 Main API Key。
- 启用密码保护时，`SITE_PASSWORD` 和 `SITE_SECRE_KEY` 必须同时设置。可以用 `openssl rand -hex 32` 生成密钥。
- EdgeOne 的环境变量不能包含空格。文本值请用 `+` 代替空格，例如 `SITE_TITLE="Huoiop+NET+Status"`。
- 版权作者固定为 **Huoiop**（<https://github.com/Huoiop/>），不再使用 `SITE_AUTHOR` / `SITE_AUTHOR_URL`。

## 🧩 数据说明

- 服务端通过 `Authorization: Bearer <API_KEY>` 调用 UptimeRobot v3 的
  `GET /monitors` 和 `GET /incidents`。
- v3 没有 v2 的 `custom_uptime_ranges`，且 `CUSTOM` 统计时间范围需要付费订阅，
  因此每日可用率根据 `Downtime` incidents 按天计算。
- 监控项创建前的日期显示为“无数据”。
- 服务端缓存 60 秒；前端每 5 分钟自动刷新，也可以手动刷新。
- UptimeRobot Free 套餐限流 10 次/分钟；一次缓存未命中通常会发起两个上游请求。

## 🌍 部署

### 构建目标

`DEPLOYMENT_PLATFORM` 决定构建产物：

| 值 | 目标平台 | 产物 |
| --- | --- | --- |
| `cloudflare`（默认） | Cloudflare Pages（NuxtHub） | `dist/` |
| `auto` | 通用 Node.js 服务器 | `.output/` |
| `eo` | EdgeOne Makers | `.edgeone/` |
| `esa` | 阿里云 ESA | `.output/server/index.mjs` + `.output/public/` |

### Cloudflare

本项目默认使用 [Cloudflare Pages](https://pages.cloudflare.com/) 部署。

- 可以使用 [NuxtHub](https://hub.nuxt.com/) 快速部署，也可以在 Cloudflare Pages 中手动连接仓库
- 在部署前配置环境变量，具体参考 `.env.example`，其中 `API_KEY` 为必填项
- 若进展顺利，就可以看到状态页了

| 配置项 | 值 |
| --- | --- |
| 构建命令 | `pnpm run build` |
| 环境变量 | `DEPLOYMENT_PLATFORM=cloudflare`、`API_KEY` 等 |
| 输出目录 | `dist/` |

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Huoiop/uptimerobot-status)

- 点击上方按钮前往部署
- 在环境变量中添加下方的内容（重要）

| 变量名称 | 值 |
| --- | --- |
| `DEPLOYMENT_PLATFORM` | `auto` |
| `API_KEY` | 你的 UptimeRobot Read-Only API Key |
| `API_URL` | `https://api.uptimerobot.com/v3/`（可选） |

其他站点变量参考 `.env.example`。

### EdgeOne Makers

设置 `DEPLOYMENT_PLATFORM=eo`，构建时会运行 `@edgeone/nuxt-pages`，并输出 EdgeOne Build Output API 结构到 `.edgeone`。

| 配置项 | 值 |
| --- | --- |
| 根目录 | `./` |
| 安装命令 | `pnpm install` |
| 构建命令 | `pnpm run build` |
| 输出目录 | `.edgeone` |
| Node.js 版本 | 22.x |

在 EdgeOne 项目设置中配置 `DEPLOYMENT_PLATFORM=eo`、`API_KEY` 以及 `.env.example` 中的其他变量，然后部署即可。

> EdgeOne 的环境变量值不能包含空格。文本类变量（`SITE_TITLE`、`SITE_DESCRIPTION`、`SITE_KEYWORDS`、`SITE_ICP`）请用 `+` 代替空格，例如 `SITE_TITLE="Huoiop+NET+服务检测"`。

### 阿里云 ESA

设置 `DEPLOYMENT_PLATFORM=esa`，构建时使用 Nitro 的 `cloudflare-module` 预设，产出边缘 Worker。

| 配置项 | 值 |
| --- | --- |
| 根目录 | `/` |
| 安装命令 | `pnpm install` |
| 构建命令 | `pnpm run build` |
| 静态资源目录 | `.output/public` |
| 函数文件路径 | `.output/server/index.mjs` |
| Node.js 版本 | 22.x |

在 ESA 项目设置中配置 `DEPLOYMENT_PLATFORM=esa`、`API_KEY` 以及 `.env.example` 中的其他变量。

也可以在仓库根目录使用 `esa.jsonc`：

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

> 存在 `esa.jsonc` 时，其配置优先于 ESA 控制台的构建配置。
>
> **不要**配置 `notFoundStrategy: singlePageApplication`：SPA 路由和 API 请求由
> Nitro 函数处理，纯静态回退会导致 `/history`、`/incidents/*` 和 `/api/*` 失效。

### 其他托管平台

请参考官方文档：[部署 Nuxt 应用](https://nuxtjs.org.cn/deploy)

## ❓ Q & A

### 如何开启站点加密

在环境变量中添加 `SITE_PASSWORD` 和 `SITE_SECRE_KEY`，两者都必须填写，缺一不可。
`SITE_PASSWORD` 是站点密码，`SITE_SECRE_KEY` 是 JWT 加密密钥，可随意填写或随机生成。

### 如何自定义页脚链接

使用 `SITE_GITHUB`、`SITE_HOME`、`SITE_EMAIL`，具体见 `.env.example`。

版权栏固定显示 `Huoiop`（跳转到 <https://github.com/Huoiop/>），作者不再通过环境变量配置。

### 每日可用率是怎么来的

UptimeRobot v3 不再提供 v2 的 `custom_uptime_ranges`，因此项目会拉取
`Downtime` incidents，并按天计算故障时长和可用率。监控项创建前的日期显示为“无数据”。

### 更新后页面还是旧的

重新部署后浏览器可能仍缓存旧 Service Worker。请强制刷新页面，或在浏览器中
清除该站点的数据后重试。

### 可以部署成纯静态站吗

不可以。`/api/*` 需要服务端运行时，`/history` 和 `/incidents/*` 也需要 SPA
路由回退。请使用 Node、Cloudflare Worker、EdgeOne 或 ESA 等带服务端运行时的平台。

## 🙏 鸣谢

- [DeepSeek 状态页](https://status.deepseek.com/) — 状态页设计参考
- [imsyy/site-status](https://github.com/imsyy/site-status) — 本项目基于此状态页
- [uptime-status](https://github.com/yb/uptime-status) — 项目灵感
- [UptimeRobot](https://uptimerobot.com/) — 监控 API
- HarmonyOS_Regular 字体由 B 站 CDN 提供

## 📄 License

[MIT](./LICENSE)

## 👤 Author

[Huoiop](https://github.com/Huoiop/)
