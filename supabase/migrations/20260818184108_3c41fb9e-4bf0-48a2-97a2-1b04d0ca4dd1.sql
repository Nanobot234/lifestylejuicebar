create table if not exists public.connect_accounts (
  id uuid primary key default gen_random_uuid(),
  environment text not null unique,
  stripe_account_id text not null,
  details_submitted boolean not null default false,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  platform_fee_cents integer not null default 150,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.connect_accounts to authenticated;
grant all on public.connect_accounts to service_role;

alter table public.connect_accounts enable row level security;

create or replace function public.is_business_owner(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = _user_id and role = 'business_owner'
  )
$$;

drop policy if exists "Business owners can view connect accounts" on public.connect_accounts;
create policy "Business owners can view connect accounts"
  on public.connect_accounts for select
  to authenticated
  using (public.is_business_owner(auth.uid()));