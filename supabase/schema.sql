-- ACCE (India) Convergence Summit — Supabase Schema
-- Run this in the Supabase SQL Editor to set up all tables, storage, and RLS policies.

-- ── Extensions ────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Enum types ────────────────────────────────────────
create type payment_status as enum ('pending', 'verified', 'rejected');

-- ── Registrations table ──────────────────────────────
create table registrations (
  id            uuid primary key default uuid_generate_v4(),
  reg_id        text unique not null,
  full_name     text not null,
  photo_url     text,
  mobile        text not null,
  email         text not null,
  qualification text,
  org_name      text,
  course_branch text,
  grad_year     text,
  designation   text,
  city          text,
  state         text,
  country       text default 'India',
  pin           text,
  address       text,
  is_acce_member boolean default false,
  payment_amount integer default 0,
  payment_screenshot_url text,
  payment_status payment_status default 'pending',
  checked_in    boolean default false,
  checked_in_at timestamptz,
  created_at    timestamptz default now()
);

create index idx_registrations_reg_id on registrations (reg_id);
create index idx_registrations_mobile on registrations (mobile);
create index idx_registrations_email on registrations (email);
create index idx_registrations_payment_status on registrations (payment_status);
create index idx_registrations_created_at on registrations (created_at desc);

-- ── Sponsorships table ────────────────────────────────
create table sponsorships (
  id             uuid primary key default uuid_generate_v4(),
  sponsor_id     text unique not null,
  company_name   text not null,
  contact_person text not null,
  phone          text not null,
  email          text not null,
  website        text,
  address        text,
  logo_url       text,
  gst            text,
  requirements   text,
  payment_status payment_status default 'pending',
  created_at     timestamptz default now()
);

create index idx_sponsorships_sponsor_id on sponsorships (sponsor_id);
create index idx_sponsorships_created_at on sponsorships (created_at desc);

-- ── Storage buckets ───────────────────────────────────
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('payments', 'payments', true);
insert into storage.buckets (id, name, public) values ('logos', 'logos', true);
insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true);

-- ── Gallery table ─────────────────────────────────────
create table if not exists gallery (
  id           uuid primary key default uuid_generate_v4(),
  title        text,
  caption      text,
  image_url    text not null,
  storage_path text,
  sort_order   integer default 0,
  created_at   timestamptz default now()
);

create index idx_gallery_sort on gallery (sort_order asc, created_at desc);

-- ── Storage RLS policies ──────────────────────────────
-- Anyone can upload to avatars (registration is public)
create policy "Public can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars');

create policy "Public can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Anyone can upload payment screenshots
create policy "Public can upload payments"
  on storage.objects for insert
  with check (bucket_id = 'payments');

create policy "Public can view payments"
  on storage.objects for select
  using (bucket_id = 'payments');

-- Anyone can upload logos
create policy "Public can upload logos"
  on storage.objects for insert
  with check (bucket_id = 'logos');

create policy "Public can view logos"
  on storage.objects for select
  using (bucket_id = 'logos');

-- Gallery: admin uploads via service role, public can view
create policy "Service role full access on gallery storage"
  on storage.objects for all
  using (bucket_id = 'gallery' and auth.role() = 'service_role');

create policy "Public can view gallery"
  on storage.objects for select
  using (bucket_id = 'gallery');

-- ── Table RLS policies ────────────────────────────────
-- Registrations: public can insert (registration form), admin can do everything
alter table registrations enable row level security;

create policy "Public can insert registrations"
  on registrations for insert
  with check (true);

create policy "Public can read own registration by reg_id"
  on registrations for select
  using (true);

create policy "Service role full access on registrations"
  on registrations for all
  using (auth.role() = 'service_role');

-- Sponsorships: public can insert, admin can do everything
alter table sponsorships enable row level security;

create policy "Public can insert sponsorships"
  on sponsorships for insert
  with check (true);

create policy "Public can read sponsorships"
  on sponsorships for select
  using (true);

create policy "Service role full access on sponsorships"
  on sponsorships for all
  using (auth.role() = 'service_role');

-- Gallery: public can read, service role can do everything
alter table gallery enable row level security;

create policy "Public can read gallery"
  on gallery for select
  using (true);

create policy "Service role full access on gallery"
  on gallery for all
  using (auth.role() = 'service_role');
