-- ============================================================================
-- KiiChain Role Verification Portal — Supabase Schema
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── Campaigns ────────────────────────────────────────────────────────────
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  banner_url text,
  eligible_roles text[] not null default '{}',   -- Discord role IDs
  deadline timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Submissions ──────────────────────────────────────────────────────────
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete set null,
  discord_id text not null,
  discord_username text not null,
  discord_avatar text,
  role_id text not null,
  role_name text,
  wallet_address text not null,
  wallet_type text not null check (wallet_type in ('evm', 'cosmos')),
  status text not null default 'confirmed' check (status in ('confirmed', 'flagged', 'revoked')),
  ip_hash text,                -- sha256 of submitter IP, never raw IP
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- one wallet can't be reused by a different Discord account
  constraint uniq_wallet unique (wallet_address)
);

-- One Discord account can't double-submit to the same campaign.
-- A plain UNIQUE(discord_id, campaign_id) constraint would NOT catch
-- duplicates when campaign_id is NULL, since Postgres treats every NULL
-- as distinct from every other NULL. Coalescing to a sentinel UUID fixes it.
create unique index if not exists uniq_discord_campaign
  on submissions (discord_id, coalesce(campaign_id, '00000000-0000-0000-0000-000000000000'::uuid));

create index if not exists idx_submissions_discord_id on submissions(discord_id);
create index if not exists idx_submissions_wallet on submissions(wallet_address);
create index if not exists idx_submissions_campaign on submissions(campaign_id);
create index if not exists idx_submissions_status on submissions(status);

-- ── Audit log ────────────────────────────────────────────────────────────
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,            -- 'system' | discord_id | 'admin'
  action text not null,           -- 'submission_created' | 'submission_edited' | 'submission_deleted' | 'admin_login' | 'role_check_failed' | 'duplicate_blocked'
  target text,                    -- e.g. submission id or discord id
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_created_at on audit_logs(created_at desc);

-- ── Duplicate / abuse attempts (for the "Duplicate attempts" admin stat) ──
create table if not exists duplicate_attempts (
  id uuid primary key default gen_random_uuid(),
  discord_id text not null,
  wallet_address text,
  reason text not null,           -- 'already_submitted' | 'wallet_in_use' | 'not_eligible' | 'not_member'
  created_at timestamptz not null default now()
);

create index if not exists idx_dup_discord on duplicate_attempts(discord_id);

-- ── updated_at trigger helper ────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_campaigns_updated_at on campaigns;
create trigger trg_campaigns_updated_at
  before update on campaigns
  for each row execute procedure set_updated_at();

drop trigger if exists trg_submissions_updated_at on submissions;
create trigger trg_submissions_updated_at
  before update on submissions
  for each row execute procedure set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────
-- All writes go through server-side API routes using the service role key,
-- which bypasses RLS. These policies lock the tables down from the
-- anon/public key, which is only ever used for read-only, non-sensitive
-- lookups (e.g. active campaign list) from the client.

alter table campaigns enable row level security;
alter table submissions enable row level security;
alter table audit_logs enable row level security;
alter table duplicate_attempts enable row level security;

-- Public can read active campaigns only (for the landing/verify page)
drop policy if exists "public read active campaigns" on campaigns;
create policy "public read active campaigns"
  on campaigns for select
  using (is_active = true);

-- No public access at all to submissions, audit logs, or duplicate attempts.
-- (No policy = no access for anon/authenticated roles; service role bypasses RLS.)

-- No default campaign is seeded here on purpose: an INSERT with
-- `ON CONFLICT DO NOTHING` only skips when it collides with an actual
-- unique constraint, and this table has none on `title` — so if this
-- script (or a migration runner) ever re-executes the insert, you get a
-- silent duplicate row instead of a no-op. Create your first campaign
-- from /admin/campaigns after deploying instead.
