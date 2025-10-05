-- Migration: finalize example table timestamps and indexing
-- Adds created_at, enforces updated_at automation, and optimizes lookups.
create extension if not exists "pgcrypto";

alter table public.example
  add column if not exists created_at timestamptz not null default now();

alter table public.example
  alter column updated_at set default now();

create or replace function public.example_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists example_set_updated_at on public.example;
create trigger example_set_updated_at
  before update on public.example
  for each row
  execute function public.example_set_updated_at();

create index if not exists example_updated_at_idx on public.example (updated_at desc);
