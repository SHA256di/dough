-- Dough: scans table for end-of-day waste analysis
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query → paste → Run

create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  photo_url text,
  total_items integer not null default 0,
  total_revenue_lost numeric(10, 2) not null default 0,
  insight text,
  items jsonb not null default '[]'::jsonb
);

-- When you add auth, enable RLS and restrict scans to the logged-in user.

comment on table public.scans is 'End-of-day waste scans from Dough vision analysis';
