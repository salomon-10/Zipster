-- ============================================================================
-- Zipster — initial schema
-- Target: PostgreSQL 15+ (Neon)
-- ============================================================================
-- Entity relationships
--   users 1──n projects        a saved architecture belongs to exactly one user
--   users 1──n generations     a ZIP download is attributed to a user when known
--   projects 1──n generations  a download may originate from a saved project
--   users 1──n file_templates  a template records its author
--
-- Generated archives are never stored. `projects.raw_tree` is the single source
-- of truth: every archive is reproducible from it on demand.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  email_norm    text not null generated always as (lower(email)) stored,
  password_hash text not null,
  username      text not null,
  avatar_url    text,
  role          text not null default 'user',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint users_email_unique unique (email_norm),
  constraint users_username_unique unique (username),
  constraint users_role_check check (role in ('user', 'admin')),
  constraint users_username_format check (username ~ '^[a-zA-Z0-9_-]{3,32}$'),
  constraint users_email_format check (position('@' in email) > 1)
);

-- ---------------------------------------------------------------------------
-- projects — a saved architecture
-- ---------------------------------------------------------------------------
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users (id) on delete cascade,
  name        text not null,
  raw_tree    text not null,
  is_public   boolean not null default false,
  share_slug  text,
  view_count  integer not null default 0,
  file_count  integer not null default 0,
  folder_count integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint projects_share_slug_unique unique (share_slug),
  constraint projects_name_length check (char_length(trim(name)) between 1 and 120),
  constraint projects_raw_tree_length check (char_length(raw_tree) <= 200000),
  constraint projects_counts_positive check (file_count >= 0 and folder_count >= 0),
  -- a public project must carry a slug, and a slug only means anything publicly
  constraint projects_public_needs_slug check (not is_public or share_slug is not null)
);

create index if not exists projects_user_id_updated_at_idx
  on projects (user_id, updated_at desc);

create index if not exists projects_public_idx
  on projects (updated_at desc) where is_public;

-- ---------------------------------------------------------------------------
-- generations — activity log, no archive path
-- ---------------------------------------------------------------------------
create table if not exists generations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users (id) on delete set null,
  project_id   uuid references projects (id) on delete set null,
  file_count   integer not null,
  folder_count integer not null,
  size_bytes   bigint not null,
  source       text not null default 'editor',
  created_at   timestamptz not null default now(),

  constraint generations_source_check check (source in ('editor', 'project', 'shared', 'import')),
  constraint generations_counts_positive
    check (file_count >= 0 and folder_count >= 0 and size_bytes >= 0)
);

create index if not exists generations_user_id_created_at_idx
  on generations (user_id, created_at desc);

create index if not exists generations_created_at_idx
  on generations (created_at desc);

-- ---------------------------------------------------------------------------
-- file_templates — starter content for well-known filenames
-- ---------------------------------------------------------------------------
create table if not exists file_templates (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  file_pattern text not null,
  framework    text,
  content      text not null,
  is_official  boolean not null default false,
  created_by   uuid references users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint file_templates_content_length check (char_length(content) <= 20000),
  constraint file_templates_pattern_length check (char_length(file_pattern) between 1 and 120)
);

create index if not exists file_templates_pattern_idx
  on file_templates (file_pattern);

create unique index if not exists file_templates_official_unique
  on file_templates (file_pattern, coalesce(framework, '')) where is_official;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at
  before update on users
  for each row execute function set_updated_at();

drop trigger if exists projects_set_updated_at on projects;
create trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();

drop trigger if exists file_templates_set_updated_at on file_templates;
create trigger file_templates_set_updated_at
  before update on file_templates
  for each row execute function set_updated_at();
