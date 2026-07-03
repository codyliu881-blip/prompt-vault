-- PromptVault 数据库结构
-- 在 Supabase SQL Editor 中执行一次即可

create extension if not exists pgcrypto;

-- 主题分类
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('image', 'video')),  -- 作图 / 视频
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  unique (type, name)
);

-- 提示词主表（body 冗余存当前版本正文，便于搜索）
create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,                     -- 当前生效版本的正文
  type text not null check (type in ('image', 'video')),
  category_id uuid references categories(id) on delete set null,
  tags text[] not null default '{}',
  source_url text,
  notes text,
  is_favorite boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 版本历史
create table if not exists prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  version_no int not null,                -- 从 1 递增
  label text not null default '',         -- 如「原始版」「修改版」「最终版」，可自定义
  body text not null,
  created_at timestamptz default now(),
  unique (prompt_id, version_no)
);

create index if not exists idx_prompts_type on prompts(type);
create index if not exists idx_prompts_category on prompts(category_id);
create index if not exists idx_prompts_favorite on prompts(is_favorite) where is_favorite;
create index if not exists idx_prompt_versions_prompt on prompt_versions(prompt_id);

-- RLS：密码墙内的单人应用，服务端一律使用 service role key 读写，
-- 因此这里开启 RLS 且不建任何 policy，彻底屏蔽 anon/authenticated 角色的直接访问。
alter table categories enable row level security;
alter table prompts enable row level security;
alter table prompt_versions enable row level security;
