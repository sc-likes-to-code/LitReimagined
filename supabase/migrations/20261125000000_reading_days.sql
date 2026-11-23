-- Words read per day, used for reading streaks. Owner-only, like the rest of the user data.
create table public.reading_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  words int not null check (words >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.reading_days enable row level security;

create policy "own reading days" on public.reading_days for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
