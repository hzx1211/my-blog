# 黄志雄的个人数字花园

> 把代码、远行、美食、音乐和生活里的小事，认真记录成可以被再次打开的记忆。

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?logo=vercel&logoColor=white)](https://my-blog-two-puce.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## 项目简介

这是一个面向真实个人内容的全栈博客项目。

它不只记录技术文章，也用来分享美食专栏、旅行足迹、音乐、生活片段、照片和 Vlog。前台负责呈现内容与氛围，后台提供独立的文章、旅行、音乐和简历管理页面；右下角的 CyberCat 则让整个博客多了一点可以被互动的陪伴感。

## 功能亮点

- **多主题内容**：技术、美食专栏、旅行、生活、思考和成长等内容分类。
- **文章阅读体验**：文章卡片支持图片和标题点击，详情页记录浏览量，并保留阅读时间等信息。
- **旅行记忆地图**：记录城市、地点、坐标和照片，支持地图标记、家所在地标记，以及通过高德接口自动补全经纬度。
- **音乐角**：独立的音乐播放器，可以播放博客中的音乐，并支持收起到页面侧边，减少对内容阅读的干扰。
- **照片与 Vlog**：支持在内容中使用图片、视频等个人媒体素材。
- **互动简历**：将个人经历、技能、项目和求职信息以更具视觉表现力的方式展示。
- **CyberCat**：支持待机、眨眼、舔爪、翻滚、吃鱼、行走和摸头互动，也可以通过 `/api/chat` 接入 AI 对话。
- **后台内容管理**：文章、旅行、音乐和简历分别拥有独立页面，登录后即可维护内容。

## 技术栈

- **前端**：Next.js 14 App Router、React 18、TypeScript、Tailwind CSS
- **交互与动画**：Framer Motion、Lucide React
- **地图**：Leaflet、React Leaflet、高德地图 Web 服务 API
- **服务端**：Next.js Route Handlers
- **认证**：HTTP-only Cookie + HMAC 会话签名
- **数据**：本地开发使用 JSON 文件；线上使用 Supabase PostgreSQL 与 Supabase Storage
- **部署**：GitHub + Vercel

## 本地运行

```bash
npm install
npm run dev
```

打开：

- 前台：<http://localhost:3000>
- 后台：<http://localhost:3000/admin>

首次启动前，复制环境变量模板：

```bash
copy .env.local.example .env.local
```

macOS、Linux 或 Git Bash 可以使用：

```bash
cp .env.local.example .env.local
```

然后填写管理员密码、会话密钥以及需要使用的第三方服务配置。

## 环境变量

```bash
# 后台认证：生产环境密码至少 12 位；会话密钥建议使用不少于 32 位的随机字符串
BLOG_ADMIN_PASSWORD=你的强管理员密码
BLOG_SESSION_SECRET=不少于32位的随机字符串

# 线上内容数据库和对象存储。服务端密钥只能放在服务端环境变量中。
SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_SERVICE_ROLE_KEY=你的服务端密钥
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon或publishable公钥

# 旅行地点自动转换为经纬度：高德开放平台 Web 服务 API Key
AMAP_API_KEY=你的高德Web服务Key

# 可选：OpenAI 兼容聊天服务，用于 CyberCat AI 对话
OPENAI_API_KEY=你的服务密钥
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

`SUPABASE_SERVICE_ROLE_KEY`（或 Supabase 新版的 `SUPABASE_SECRET_KEY`）只在服务端使用；它有完整数据权限，绝不能加 `NEXT_PUBLIC_` 前缀。浏览器只使用 anon/publishable 公钥。不要把 `.env.local`、API Key 或管理员密码提交到 GitHub；修改本地环境变量后需要重启开发服务。

## 启用线上数据保存

1. 在 Supabase 创建项目，在 **SQL Editor** 执行 [`supabase/schema.sql`](supabase/schema.sql)。它会创建内容表 `blog_content` 和公开媒体桶 `blog-media`。
2. 在项目根目录创建 `.env.local`（可从 `.env.local.example` 复制），填入 Supabase URL、服务端密钥和浏览器公钥。不要把服务端密钥发到聊天或提交到仓库。
3. 首次导入仓库里现有的文章、旅行、音乐、简历和旧媒体：先执行 `npm run supabase:import` 预览，再执行 `npm run supabase:import -- --apply`。导入只会新增线上尚不存在的内容，不覆盖已有记录；导入前请确认 Supabase 中没有需要保留的同名内容。
4. 在 Vercel 项目的 **Settings → Environment Variables** 添加 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`，至少选中 Production；然后重新部署。

完成后，后台修改文章、旅行、音乐、简历和浏览量会写入 Supabase；新上传的媒体会直传 Supabase Storage，不依赖 Vercel 临时文件系统。本地未设置 Supabase 时仍使用 `data/*.json`，便于开发。若线上缺少服务端数据库配置，后台会明确报错而不会假装保存成功。

## 主要接口

| 方法 | 地址 | 作用 |
| --- | --- | --- |
| GET | `/api/health` | 检查服务状态 |
| POST | `/api/chat` | CyberCat AI 对话 |
| GET | `/api/posts` | 获取已发布文章 |
| GET | `/api/posts/:slug` | 获取文章详情 |
| POST | `/api/posts/:slug/view` | 记录文章浏览量 |
| GET | `/api/journeys` | 获取旅行足迹 |
| GET | `/api/music` | 获取音乐列表 |
| POST | `/api/admin/login` | 管理员登录 |
| GET / POST | `/api/admin/posts` | 查询或创建文章，需要登录 |
| PATCH / DELETE | `/api/admin/posts/:id` | 修改或删除文章，需要登录 |

## 项目结构

```text
app/                 页面与 Route Handlers
components/blog/     前台博客、地图、音乐角与 CyberCat
components/admin/    后台管理界面
lib/server/          认证、文章、旅行、音乐和简历的数据访问逻辑
data/                JSON 内容数据
public/               图片、音频、视频和动画素材
```

## 部署说明

项目已经接入 GitHub 和 Vercel，可作为在线展示站点使用：

<https://my-blog-two-puce.vercel.app>

Vercel 项目代码已准备好连接 Supabase，但线上持久化需要完成上方 SQL、Vercel 环境变量及重新部署步骤。Vercel Serverless 的运行时文件系统不是持久存储，因此正式线上内容和上传媒体应保存在 Supabase。

上线前建议检查：

1. 生产环境管理员密码和会话密钥是否已经更换。
2. AI、高德地图等服务的环境变量是否配置在正确的 Production 环境。
3. 登录、文章发布、媒体上传、浏览量、地图定位和 AI 聊天是否都能正常工作。
4. 图片、音乐和视频是否拥有相应的发布与使用权限。

## 许可证

本项目主要用于个人作品展示、学习和求职交流。项目中的个人照片、音乐、视频和简历内容不代表开源授权，未经允许请勿转载或用于商业用途。
