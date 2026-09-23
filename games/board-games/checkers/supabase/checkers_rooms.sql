create table if not exists public.checkers_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  game text not null default 'checkers' check (game = 'checkers'),
  status text not null default 'waiting' check (status in ('waiting','playing','finished')),
  host_user_id uuid references auth.users(id) on delete set null,
  red_user_id uuid references auth.users(id) on delete set null,
  black_user_id uuid references auth.users(id) on delete set null,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.checkers_rooms enable row level security;

drop policy if exists checkers_rooms_select on public.checkers_rooms;
drop policy if exists checkers_rooms_insert on public.checkers_rooms;
drop policy if exists checkers_rooms_update on public.checkers_rooms;

create policy checkers_rooms_select
on public.checkers_rooms
for select
to authenticated
using (
  game = 'checkers'
  and (
    status = 'waiting'
    or host_user_id = (select auth.uid())
    or red_user_id = (select auth.uid())
    or black_user_id = (select auth.uid())
  )
);

create policy checkers_rooms_insert
on public.checkers_rooms
for insert
to authenticated
with check (
  game = 'checkers'
  and host_user_id = (select auth.uid())
  and (
    red_user_id = (select auth.uid())
    or black_user_id = (select auth.uid())
  )
);

create policy checkers_rooms_update
on public.checkers_rooms
for update
to authenticated
using (
  game = 'checkers'
  and (
    status = 'waiting'
    or host_user_id = (select auth.uid())
    or red_user_id = (select auth.uid())
    or black_user_id = (select auth.uid())
  )
)
with check (
  game = 'checkers'
  and (
    host_user_id = (select auth.uid())
    or red_user_id = (select auth.uid())
    or black_user_id = (select auth.uid())
  )
);

do $$
begin
  alter publication supabase_realtime add table public.checkers_rooms;
exception
  when duplicate_object then
    null;
end
$$;
