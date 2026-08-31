# 黄志雄的数字花园

一个记录技术、旅行、美食与生活的全栈个人博客。前台包含文章、旅行地图、音乐角、照片与 Vlog、互动简历和 CyberCat；后台用于维护文章、足迹、歌单与简历内容。

## 技术栈

- 前端：Next.js 14 App Router、React、TypeScript、Tailwind CSS、Framer Motion
- 服务端：Next.js Route Handlers
- 数据存储：本地 JSON 文件与媒体文件
- 登录认证：HTTP-only Cookie + HMAC 会话签名

## 本地启动

```bash
npm install
npm run dev
```

前台地址：`http://localhost:3000`

后台地址：`http://localhost:3000/admin`

首次启动前，将 `.env.local.example` 复制为 `.env.local`，并设置独立的强管理员密码和不少于 32 位的随机会话密钥。不要把 `.env.local` 提交到公开仓库。

## 环境变量

```bash
BLOG_ADMIN_PASSWORD=你的强管理员密码
BLOG_SESSION_SECRET=不少于32位的随机字符串

# 国内地址自动转换为经纬度：高德开放平台 Web 服务 API Key
AMAP_API_KEY=你的高德Web服务Key

# 可选：OpenAI 兼容的聊天服务
OPENAI_API_KEY=你的服务密钥
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

修改环境变量后需要重启服务。API Key 只在服务端读取，不要写入前端组件或提交到 Git。

## CyberCat 与 AI 聊天

右下角的 CyberCat 位于 `components/blog/CyberCat.tsx`，动画素材位于 `public/`。它支持待机、眨眼、摸头、舔爪、翻滚、行走和吃鱼动画，并通过 `/api/chat` 回答普通问题与天气问题。未配置 AI Key 时会使用有限的本地回复。

## 主要接口

| 方法 | 地址 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 服务健康检查 |
| POST | `/api/chat` | CyberCat 聊天 |
| GET | `/api/posts` | 查询已发布文章 |
| GET | `/api/posts/:slug` | 查询文章详情 |
| POST | `/api/posts/:slug/view` | 记录文章浏览量 |
| POST | `/api/admin/login` | 管理员登录 |
| POST | `/api/admin/logout` | 管理员退出 |
| GET / POST | `/api/admin/posts` | 查询或创建文章，需要登录 |
| PATCH / DELETE | `/api/admin/posts/:id` | 修改或删除文章，需要登录 |

## 上线注意事项

- 当前文章、旅行、音乐、简历和浏览量依赖本地文件写入，适合带持久磁盘的 Node.js 主机或容器。
- Vercel 等无状态 Serverless 平台不会可靠保存运行时文件修改；部署到这类平台前，应将数据和媒体迁移到数据库与对象存储。
- 上线前必须更换管理员密码和会话密钥，并确认 `.env.local` 没有进入版本控制。
- 公开音乐、图片和视频前，请确认拥有相应的发布权利。
- 建议上线后依次验证登录、文章发布、媒体上传、浏览量、AI 聊天和重启后的数据持久化。
