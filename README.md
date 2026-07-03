# PromptVault 提示词库

单人使用的提示词存储、检索与测试工具。按「作图 / 视频」两大类 + 自定义主题分类管理提示词，支持关键词秒搜、收藏、版本历史与对比、一键复制、一键跳转到 ChatGPT / 即梦测试，以及 JSON / Markdown / CSV 导入导出。

技术栈：Next.js 16（App Router，Turbopack）+ React 19 + Tailwind CSS v4 + Motion + Supabase + Vercel。

## 快速开始

### 1. 创建 Supabase 项目

在 [Supabase](https://supabase.com) 新建一个项目，然后在 SQL Editor 中依次执行：

1. `supabase/schema.sql` —— 建表（必需）
2. `supabase/seed.sql` —— 示例数据（可选，用于快速体验界面）

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`，填入：

```
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase 项目 URL
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service_role key（Settings → API）
ACCESS_PASSWORD=你自定义的访问密码
```

`SUPABASE_SERVICE_ROLE_KEY` 拥有绕过 RLS 的完整权限，仅在服务端使用，切勿加 `NEXT_PUBLIC_` 前缀或暴露给浏览器。

### 3. 本地运行

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，输入 `ACCESS_PASSWORD` 中设置的密码登录。

### 4. 部署到 Vercel

导入本仓库，在项目设置中配置上述三个环境变量后部署即可。

## 目录结构

```
app/                 页面（首页、登录、设置、登录 API）
components/          UI 组件（侧栏、列表、卡片、详情面板、版本对比等）
lib/actions/         Server Actions（分类 / 提示词 / 版本 / 导入导出）
lib/data.ts          服务端数据查询（Supabase）
lib/supabase/        Supabase 客户端与手写数据库类型
proxy.ts             密码墙（Next.js 16 中 middleware 已更名为 proxy）
supabase/            数据库 schema 与种子数据 SQL
```

## 已知的 v1 范围之外的功能

- 不做用户系统 / 多人协作，仅靠单一访问密码保护
- 「测试」按钮只做复制 + 跳转，不做 API 直调生成（v2 再做）
- 不支持 Markdown 导入
- 不做全文检索引擎，搜索为客户端关键词匹配（个人数据量级足够快）
