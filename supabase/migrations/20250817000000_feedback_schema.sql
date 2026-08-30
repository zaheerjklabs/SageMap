-- ==============================================================================
-- SageMap: Feedback System Schema & RLS Policies
-- Enables user feedback submissions and admin triage inbox with Supabase Realtime
-- ==============================================================================

-- 1. Create feedback table
create table if not exists public.feedback (
  id text primary key,
  user_id uuid references auth.users on delete set null,
  user_email text,
  user_name text,
  category text not null check (category in ('feature', 'bug', 'content', 'general', 'question')),
  topic_id integer,
  rating integer check (rating >= 1 and rating <= 5),
  message text not null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved', 'archived')),
  is_starred boolean not null default false,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for speedy triage queries
create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
create index if not exists feedback_status_idx on public.feedback (status);
create index if not exists feedback_category_idx on public.feedback (category);

-- 2. Enable Row Level Security
alter table public.feedback enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Anyone can insert feedback" on public.feedback;
drop policy if exists "Admins can view all feedback" on public.feedback;
drop policy if exists "Admins can update feedback" on public.feedback;
drop policy if exists "Admins can delete feedback" on public.feedback;
drop policy if exists "Users can view own feedback" on public.feedback;

-- Anyone (anonymous visitors & authenticated users) can submit feedback
create policy "Anyone can insert feedback"
  on public.feedback for insert
  with check (true);

-- Authenticated users can view feedback they authored
create policy "Users can view own feedback"
  on public.feedback for select
  using (auth.uid() is not null and auth.uid() = user_id);

-- Only Admins can view all feedback
create policy "Admins can view all feedback"
  on public.feedback for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only Admins can update feedback (status, notes, starring)
create policy "Admins can update feedback"
  on public.feedback for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only Admins can delete feedback
create policy "Admins can delete feedback"
  on public.feedback for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 3. Sync updated_at on update
drop trigger if exists feedback_set_updated_at on public.feedback;
create trigger feedback_set_updated_at
  before update on public.feedback
  for each row execute function public.set_updated_at();

-- 4. Enable Supabase Realtime broadcast for feedback
alter publication supabase_realtime add table public.feedback;
