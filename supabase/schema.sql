-- ─────────────────────────────────────────────────────────────
--  Word Archer — opsiyonel global sıralama şeması (Supabase / Postgres)
--  Supabase panelinde: SQL Editor → New query → bu dosyayı yapıştır → Run
-- ─────────────────────────────────────────────────────────────

create table if not exists public.scores (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text    not null check (char_length(name) between 2 and 16),
  mode        text    not null check (mode in ('classic', 'survival', 'daily')),
  duration    int     not null check (duration in (0, 15, 30, 60, 120)),
  difficulty  text    not null check (difficulty in ('easy', 'normal', 'hard')),
  lang        text    not null check (lang in ('en', 'tr')),
  score       int     not null check (score between 1 and 200000),
  wpm         int     not null check (wpm between 0 and 250),
  accuracy    numeric(5, 1) not null check (accuracy between 0 and 100),
  kills       int     not null check (kills between 0 and 1000),
  seed        text    check (seed is null or char_length(seed) <= 16),
  -- mod ile süre tutarlı olmalı
  check ((mode = 'classic' and duration in (15, 30, 60, 120)) or (mode = 'daily' and duration = 60) or (mode = 'survival' and duration = 0)),
  check ((mode = 'daily') = (seed is not null)),
  check (mode <> 'daily' or difficulty = 'normal')
);

create index if not exists scores_board_idx on public.scores (mode, duration, difficulty, lang, score desc);
create index if not exists scores_seed_idx on public.scores (seed) where seed is not null;

-- Satır düzeyi güvenlik: herkes okuyabilir ve ekleyebilir; güncelleme/silme yok.
alter table public.scores enable row level security;

drop policy if exists "scores are readable by everyone" on public.scores;
create policy "scores are readable by everyone" on public.scores
  for select using (true);

drop policy if exists "anyone can submit a score" on public.scores;
create policy "anyone can submit a score" on public.scores
  for insert with check (true);

-- Her oyuncunun (ada göre) en iyi skoru; tabloyu tek kişi doldurmasın.
-- (eski imza varsa kaldır)
drop function if exists public.top_scores(text, int, text, timestamptz, text, int);

create or replace function public.top_scores(
  p_mode     text,
  p_duration int,
  p_difficulty text,
  p_lang     text,
  p_since    timestamptz default null,
  p_seed     text default null,
  p_limit    int default 20
)
returns table (name text, score int, wpm int, accuracy numeric, created_at timestamptz)
language sql
stable
as $$
  select b.name, b.score, b.wpm, b.accuracy, b.created_at
  from (
    select distinct on (lower(s.name)) s.name, s.score, s.wpm, s.accuracy, s.created_at
    from public.scores s
    where s.mode = p_mode
      and s.duration = p_duration
      and s.difficulty = p_difficulty
      and s.lang = p_lang
      and (p_since is null or s.created_at >= p_since)
      and (p_seed is null or s.seed = p_seed)
    order by lower(s.name), s.score desc, s.created_at asc
  ) b
  order by b.score desc, b.created_at asc
  limit least(greatest(p_limit, 1), 50);
$$;

grant execute on function public.top_scores(text, int, text, text, timestamptz, text, int) to anon, authenticated;
