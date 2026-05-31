-- ============================================================
-- SIDEDOCK Database Schema
-- Supabase SQL Editor에 붙여넣기하여 실행
-- ============================================================

-- 1. profiles 테이블 (auth.users와 연동)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  website_url text,
  twitter_url text,
  is_admin boolean default false not null,
  created_at timestamptz default now() not null
);

-- 신규 유저 가입 시 자동으로 profile 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. products 테이블
create type product_category as enum (
  'ai-tool', 'saas', 'dev-tool', 'productivity', 'design', 'marketing', 'other'
);

create table public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  tagline text not null,
  description text not null,
  url text not null,
  thumbnail_url text,
  video_url text,
  gallery_images text[] default '{}',
  category product_category not null default 'other',
  tags text[] default '{}',
  maker_id uuid references public.profiles(id) on delete cascade not null,
  upvote_count integer default 0 not null,
  comment_count integer default 0 not null,
  is_featured boolean default false not null,
  featured_label text,
  source text not null default 'launch' check (source in ('curated', 'launch')),
  launched_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  -- Full-Text Search (한국어 + 영어)
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(tagline, '') || ' ' || coalesce(description, ''))
  ) stored
);

create index products_search_idx on public.products using gin(search_vector);
create index products_launched_at_idx on public.products(launched_at desc);
create index products_upvote_count_idx on public.products(upvote_count desc);
create index products_is_featured_idx on public.products(is_featured) where is_featured = true;
create index products_source_idx on public.products(source);

-- 3. upvotes 테이블
create table public.upvotes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(user_id, product_id)
);

-- upvote 시 products.upvote_count 자동 증감
create or replace function public.handle_upvote_insert()
returns trigger as $$
begin
  update public.products set upvote_count = upvote_count + 1 where id = new.product_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.handle_upvote_delete()
returns trigger as $$
begin
  update public.products set upvote_count = upvote_count - 1 where id = old.product_id;
  return old;
end;
$$ language plpgsql security definer;

create trigger on_upvote_insert
  after insert on public.upvotes
  for each row execute procedure public.handle_upvote_insert();

create trigger on_upvote_delete
  after delete on public.upvotes
  for each row execute procedure public.handle_upvote_delete();

-- 4. comments 테이블
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

create index comments_product_id_idx on public.comments(product_id);

-- comment 수 자동 증감
create or replace function public.handle_comment_insert()
returns trigger as $$
begin
  update public.products set comment_count = comment_count + 1 where id = new.product_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.handle_comment_delete()
returns trigger as $$
begin
  update public.products set comment_count = comment_count - 1 where id = old.product_id;
  return old;
end;
$$ language plpgsql security definer;

create trigger on_comment_insert
  after insert on public.comments
  for each row execute procedure public.handle_comment_insert();

create trigger on_comment_delete
  after delete on public.comments
  for each row execute procedure public.handle_comment_delete();

-- 5. saved_products 테이블 (북마크)
create table public.saved_products (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(user_id, product_id)
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.upvotes enable row level security;
alter table public.comments enable row level security;
alter table public.saved_products enable row level security;

-- profiles: 누구나 읽기, 본인만 수정
create policy "profiles_read_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- products: 누구나 읽기, 로그인 유저만 등록, 본인만 수정/삭제
create policy "products_read_all" on public.products for select using (true);
create policy "products_insert_auth" on public.products for insert with check (auth.uid() = maker_id);
create policy "products_update_own" on public.products for update using (auth.uid() = maker_id);
create policy "products_delete_own" on public.products for delete using (auth.uid() = maker_id);

-- upvotes: 로그인 유저만, 본인 것만 관리
create policy "upvotes_read_all" on public.upvotes for select using (true);
create policy "upvotes_insert_auth" on public.upvotes for insert with check (auth.uid() = user_id);
create policy "upvotes_delete_own" on public.upvotes for delete using (auth.uid() = user_id);

-- comments: 누구나 읽기, 로그인 유저만 작성, 본인만 삭제
create policy "comments_read_all" on public.comments for select using (true);
create policy "comments_insert_auth" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_delete_own" on public.comments for delete using (auth.uid() = user_id);

-- saved_products: 본인만 관리
create policy "saved_read_own" on public.saved_products for select using (auth.uid() = user_id);
create policy "saved_insert_auth" on public.saved_products for insert with check (auth.uid() = user_id);
create policy "saved_delete_own" on public.saved_products for delete using (auth.uid() = user_id);

-- ============================================================
-- Dev Log 커뮤니티
-- ============================================================

-- 6. devlog_posts 테이블
create table public.devlog_posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null, -- markdown
  tags text[] default '{}',
  like_count integer default 0 not null,
  comment_count integer default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) stored
);

create index devlog_posts_author_idx on public.devlog_posts(author_id);
create index devlog_posts_created_at_idx on public.devlog_posts(created_at desc);
create index devlog_posts_search_idx on public.devlog_posts using gin(search_vector);

-- 7. devlog_likes 테이블
create table public.devlog_likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.devlog_posts(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(user_id, post_id)
);

-- like_count 자동 증감
create or replace function public.handle_devlog_like_insert()
returns trigger as $$
begin
  update public.devlog_posts set like_count = like_count + 1 where id = new.post_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.handle_devlog_like_delete()
returns trigger as $$
begin
  update public.devlog_posts set like_count = like_count - 1 where id = old.post_id;
  return old;
end;
$$ language plpgsql security definer;

create trigger on_devlog_like_insert
  after insert on public.devlog_likes
  for each row execute procedure public.handle_devlog_like_insert();

create trigger on_devlog_like_delete
  after delete on public.devlog_likes
  for each row execute procedure public.handle_devlog_like_delete();

-- 8. devlog_comments 테이블
create table public.devlog_comments (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.devlog_posts(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

create index devlog_comments_post_id_idx on public.devlog_comments(post_id);

-- comment_count 자동 증감
create or replace function public.handle_devlog_comment_insert()
returns trigger as $$
begin
  update public.devlog_posts set comment_count = comment_count + 1 where id = new.post_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.handle_devlog_comment_delete()
returns trigger as $$
begin
  update public.devlog_posts set comment_count = comment_count - 1 where id = old.post_id;
  return old;
end;
$$ language plpgsql security definer;

create trigger on_devlog_comment_insert
  after insert on public.devlog_comments
  for each row execute procedure public.handle_devlog_comment_insert();

create trigger on_devlog_comment_delete
  after delete on public.devlog_comments
  for each row execute procedure public.handle_devlog_comment_delete();

-- RLS
alter table public.devlog_posts enable row level security;
alter table public.devlog_likes enable row level security;
alter table public.devlog_comments enable row level security;

create policy "devlog_posts_read_all"    on public.devlog_posts for select using (true);
create policy "devlog_posts_insert_auth" on public.devlog_posts for insert with check (auth.uid() = author_id);
create policy "devlog_posts_update_own"  on public.devlog_posts for update using (auth.uid() = author_id);
create policy "devlog_posts_delete_own"  on public.devlog_posts for delete using (auth.uid() = author_id);

create policy "devlog_likes_read_all"    on public.devlog_likes for select using (true);
create policy "devlog_likes_insert_auth" on public.devlog_likes for insert with check (auth.uid() = user_id);
create policy "devlog_likes_delete_own"  on public.devlog_likes for delete using (auth.uid() = user_id);

create policy "devlog_comments_read_all"    on public.devlog_comments for select using (true);
create policy "devlog_comments_insert_auth" on public.devlog_comments for insert with check (auth.uid() = author_id);
create policy "devlog_comments_delete_own"  on public.devlog_comments for delete using (auth.uid() = author_id);

-- ============================================================
-- Migration: Admin support
-- Supabase SQL Editor에서 실행
-- ============================================================
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean default false not null;
-- UPDATE public.profiles SET is_admin = true
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'milgun366@gmail.com');

-- ============================================================
-- Migration: Media gallery support
-- Supabase SQL Editor에서 실행
-- ============================================================
-- ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_images text[] default '{}';

