-- Leaderboard schema. Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Also enable Authentication -> Sign In / Providers -> "Allow anonymous sign-ins".

create table public.leaderboard (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  nickname   text    not null check (char_length(nickname) between 2 and 20),
  xp         integer not null default 0 check (xp >= 0),
  streak     integer not null default 0 check (streak >= 0),
  correct    integer not null default 0 check (correct >= 0),
  total      integer not null default 0 check (total >= correct),
  updated_at timestamptz not null default now()
);

-- Nicknames are unique, ignoring case.
create unique index leaderboard_nickname_key on public.leaderboard (lower(nickname));
create index leaderboard_xp_idx on public.leaderboard (xp desc, updated_at);

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger leaderboard_touch before update on public.leaderboard
  for each row execute function public.touch_updated_at();

-- Row level security: anyone can read; each player can only write their own row.
alter table public.leaderboard enable row level security;

create policy "anyone can read" on public.leaderboard
  for select using (true);

create policy "insert own row" on public.leaderboard
  for insert to authenticated with check (auth.uid() = user_id);

create policy "update own row" on public.leaderboard
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete own row" on public.leaderboard
  for delete to authenticated using (auth.uid() = user_id);
