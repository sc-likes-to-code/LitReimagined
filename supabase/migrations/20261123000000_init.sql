-- LitReimagined initial schema
-- Run in the Supabase SQL editor or via `supabase db push`.

create extension if not exists pgcrypto;
create extension if not exists vector;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------
-- Catalogue (public read, server-side write)
-- ---------------------------------------------------------------------
create table public.authors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  born_year int,
  died_year int,
  nationality text,
  bio text not null default '',
  portrait_url text,
  created_at timestamptz not null default now()
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  author_id uuid not null references public.authors(id) on delete restrict,
  gutenberg_id int,
  original_year int,
  language text not null default 'en',
  era text,
  genres text[] not null default '{}',
  moods text[] not null default '{}',
  difficulty smallint check (difficulty between 1 and 5),
  word_count int,
  reading_minutes int,
  synopsis text not null default '',
  why_read text not null default '',
  cover_url text,
  cover_style jsonb not null default '{}'::jsonb,
  featured boolean not null default false,
  published boolean not null default false,
  embedding vector(768),
  created_at timestamptz not null default now()
);
create index books_author_idx on public.books(author_id);
create index books_genres_idx on public.books using gin (genres);
create index books_moods_idx on public.books using gin (moods);
create index books_title_trgm_idx on public.books using gin (title gin_trgm_ops);
create index books_embedding_idx on public.books using hnsw (embedding vector_cosine_ops);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  idx int not null,
  title text not null,
  original_paragraphs jsonb not null default '[]'::jsonb,
  word_count int not null default 0,
  unique (book_id, idx)
);

-- level: 1 = light, 2 = modern, 3 = contemporary. paragraphs align 1:1 with the original.
create table public.translations (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  level smallint not null check (level between 1 and 3),
  paragraphs jsonb not null default '[]'::jsonb,
  model text,
  prompt_version text,
  status text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  created_at timestamptz not null default now(),
  unique (chapter_id, level)
);

create table public.glossary (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  term text not null,
  definition text not null,
  modern_equiv text,
  unique (book_id, term)
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  cover_url text,
  sort int not null default 0
);

create table public.collection_books (
  collection_id uuid not null references public.collections(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  sort int not null default 0,
  primary key (collection_id, book_id)
);

-- ---------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.user_books (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  status text not null default 'want' check (status in ('want', 'reading', 'finished')),
  last_chapter int not null default 0,
  last_paragraph int not null default 0,
  level smallint not null default 2 check (level between 0 and 3),
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  chapter_idx int not null,
  paragraph_idx int not null,
  created_at timestamptz not null default now()
);
create index bookmarks_user_idx on public.bookmarks(user_id, book_id);

create table public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  chapter_idx int not null,
  paragraph_idx int not null,
  quote text not null,
  color text not null default 'ember',
  note text,
  created_at timestamptz not null default now()
);
create index highlights_user_idx on public.highlights(user_id, book_id);

-- ---------------------------------------------------------------------
-- AI cache and quota (server-only writes via the service role)
-- ---------------------------------------------------------------------
create table public.ai_cache (
  key text primary key,
  feature text not null,
  output jsonb not null,
  hits int not null default 0,
  created_at timestamptz not null default now()
);

create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  anon_id text,
  feature text not null,
  day date not null default current_date,
  cost_units int not null default 1,
  created_at timestamptz not null default now()
);
create index ai_usage_user_day_idx on public.ai_usage(user_id, day);
create index ai_usage_anon_day_idx on public.ai_usage(anon_id, day);

create table public.ai_global_usage (
  day date not null,
  feature text not null,
  count int not null default 0,
  primary key (day, feature)
);

-- ---------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomically add to the site-wide daily counter; returns the new total.
create or replace function public.bump_ai_global_usage(p_feature text, p_amount int default 1)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  total int;
begin
  insert into public.ai_global_usage (day, feature, count)
  values (current_date, p_feature, p_amount)
  on conflict (day, feature) do update set count = public.ai_global_usage.count + p_amount
  returning count into total;
  return total;
end;
$$;

-- Semantic search over book embeddings.
create or replace function public.match_books(query_embedding vector(768), match_count int default 6)
returns table (id uuid, slug text, title text, similarity float)
language sql
stable
as $$
  select b.id, b.slug, b.title, 1 - (b.embedding <=> query_embedding) as similarity
  from public.books b
  where b.published and b.embedding is not null
  order by b.embedding <=> query_embedding
  limit match_count;
$$;

-- ---------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------
alter table public.authors enable row level security;
alter table public.books enable row level security;
alter table public.chapters enable row level security;
alter table public.translations enable row level security;
alter table public.glossary enable row level security;
alter table public.collections enable row level security;
alter table public.collection_books enable row level security;
alter table public.profiles enable row level security;
alter table public.user_books enable row level security;
alter table public.bookmarks enable row level security;
alter table public.highlights enable row level security;
alter table public.ai_cache enable row level security;
alter table public.ai_usage enable row level security;
alter table public.ai_global_usage enable row level security;

-- Public catalogue: readable by everyone, only for published books.
create policy "authors are public" on public.authors for select using (true);
create policy "published books are public" on public.books for select using (published);
create policy "chapters of published books" on public.chapters for select
  using (exists (select 1 from public.books b where b.id = book_id and b.published));
create policy "finished translations of published books" on public.translations for select
  using (
    status = 'done'
    and exists (
      select 1 from public.chapters c join public.books b on b.id = c.book_id
      where c.id = chapter_id and b.published
    )
  );
create policy "glossary of published books" on public.glossary for select
  using (exists (select 1 from public.books b where b.id = book_id and b.published));
create policy "collections are public" on public.collections for select using (true);
create policy "collection books are public" on public.collection_books for select using (true);

-- Private user data: owner only.
create policy "own profile" on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "own shelf" on public.user_books for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own bookmarks" on public.bookmarks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own highlights" on public.highlights for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ai_cache / ai_usage / ai_global_usage: no policies, so only the service role can touch them.
