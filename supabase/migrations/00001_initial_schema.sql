-- ============================================
-- Addness-style Task Management Tool
-- Database Migration
-- ============================================

-- Enable extensions
create extension if not exists pgcrypto with schema extensions;

-- 1. Teams
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Profiles
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  team_id uuid references public.teams on delete set null,
  full_name text not null,
  email text not null,
  avatar_url text,
  role text not null default 'member' check (role in ('admin', 'member')),
  manager_id uuid references public.profiles on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Team Invitations
create table public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  token text not null default encode(extensions.gen_random_bytes(32), 'hex'),
  invited_by uuid not null references public.profiles on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  expires_at timestamptz default now() + interval '7 days',
  created_at timestamptz default now()
);

-- 4. Goals
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams on delete cascade,
  parent_id uuid references public.goals on delete cascade,
  title text not null,
  description text,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed', 'on_hold')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  completion_criteria text,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  created_by uuid not null references public.profiles on delete cascade,
  path text not null default '',
  depth integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Goal Assignees
create table public.goal_assignees (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals on delete cascade,
  profile_id uuid not null references public.profiles on delete cascade,
  assigned_at timestamptz default now(),
  assigned_by uuid not null references public.profiles on delete cascade,
  unique(goal_id, profile_id)
);

-- 6. Goal Comments
create table public.goal_comments (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals on delete cascade,
  profile_id uuid not null references public.profiles on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. Goal Activities
create table public.goal_activities (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals on delete cascade,
  profile_id uuid not null references public.profiles on delete cascade,
  action text not null check (action in ('created', 'updated', 'status_changed', 'comment_added', 'assignee_added', 'assignee_removed')),
  details jsonb,
  created_at timestamptz default now()
);

-- 8. Daily Tasks
create table public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams on delete cascade,
  profile_id uuid not null references public.profiles on delete cascade,
  title text not null,
  is_completed boolean not null default false,
  goal_id uuid references public.goals on delete set null,
  due_date date not null default current_date,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams on delete cascade,
  profile_id uuid not null references public.profiles on delete cascade,
  type text not null check (type in ('goal_assigned', 'goal_updated', 'comment_added', 'invitation', 'reminder')),
  title text not null,
  message text not null,
  is_read boolean not null default false,
  related_goal_id uuid references public.goals on delete set null,
  related_profile_id uuid references public.profiles on delete set null,
  created_at timestamptz default now()
);

-- 10. Integrations
create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams on delete cascade,
  service_name text not null,
  is_connected boolean not null default false,
  config jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 11. Help Articles
create table public.help_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Indexes
-- ============================================
create index idx_profiles_team_id on public.profiles(team_id);
create index idx_profiles_manager_id on public.profiles(manager_id);
create index idx_goals_team_id on public.goals(team_id);
create index idx_goals_parent_id on public.goals(parent_id);
create index idx_goals_created_by on public.goals(created_by);
create index idx_goals_path on public.goals(path);
create index idx_goal_assignees_goal_id on public.goal_assignees(goal_id);
create index idx_goal_assignees_profile_id on public.goal_assignees(profile_id);
create index idx_goal_comments_goal_id on public.goal_comments(goal_id);
create index idx_goal_activities_goal_id on public.goal_activities(goal_id);
create index idx_daily_tasks_profile_date on public.daily_tasks(profile_id, due_date);
create index idx_notifications_profile_id on public.notifications(profile_id, is_read);
create index idx_team_invitations_token on public.team_invitations(token);
create index idx_team_invitations_email on public.team_invitations(email);

-- ============================================
-- Helper Functions
-- ============================================
create or replace function public.get_user_team_id()
returns uuid
language sql
stable
security definer
as $$
  select team_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_team_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at triggers
create trigger set_updated_at before update on public.teams for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.profiles for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.goals for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.goal_comments for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.daily_tasks for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.integrations for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.help_articles for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- Row Level Security
-- ============================================
alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.team_invitations enable row level security;
alter table public.goals enable row level security;
alter table public.goal_assignees enable row level security;
alter table public.goal_comments enable row level security;
alter table public.goal_activities enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.notifications enable row level security;
alter table public.integrations enable row level security;
alter table public.help_articles enable row level security;

-- Teams: members can view their team
create policy "Users can view own team" on public.teams for select using (id = public.get_user_team_id());
create policy "Admins can update team" on public.teams for update using (id = public.get_user_team_id() and public.is_team_admin());
create policy "Authenticated users can create teams" on public.teams for insert with check (auth.uid() is not null);

-- Profiles: team members can view each other
create policy "Team members can view profiles" on public.profiles for select using (team_id = public.get_user_team_id() or id = auth.uid());
create policy "Users can update own profile" on public.profiles for update using (id = auth.uid());
create policy "System can insert profiles" on public.profiles for insert with check (id = auth.uid());

-- Team Invitations
create policy "Team members can view invitations" on public.team_invitations for select using (team_id = public.get_user_team_id());
create policy "Admins can create invitations" on public.team_invitations for insert with check (team_id = public.get_user_team_id() and public.is_team_admin());
create policy "Admins can update invitations" on public.team_invitations for update using (team_id = public.get_user_team_id() and public.is_team_admin());

-- Goals: team scoped
create policy "Team members can view goals" on public.goals for select using (team_id = public.get_user_team_id());
create policy "Team members can create goals" on public.goals for insert with check (team_id = public.get_user_team_id());
create policy "Team members can update goals" on public.goals for update using (team_id = public.get_user_team_id());
create policy "Team members can delete goals" on public.goals for delete using (team_id = public.get_user_team_id());

-- Goal Assignees
create policy "Team members can view assignees" on public.goal_assignees for select using (
  exists(select 1 from public.goals where goals.id = goal_assignees.goal_id and goals.team_id = public.get_user_team_id())
);
create policy "Team members can manage assignees" on public.goal_assignees for insert with check (
  exists(select 1 from public.goals where goals.id = goal_assignees.goal_id and goals.team_id = public.get_user_team_id())
);
create policy "Team members can remove assignees" on public.goal_assignees for delete using (
  exists(select 1 from public.goals where goals.id = goal_assignees.goal_id and goals.team_id = public.get_user_team_id())
);

-- Goal Comments
create policy "Team members can view comments" on public.goal_comments for select using (
  exists(select 1 from public.goals where goals.id = goal_comments.goal_id and goals.team_id = public.get_user_team_id())
);
create policy "Team members can add comments" on public.goal_comments for insert with check (
  exists(select 1 from public.goals where goals.id = goal_comments.goal_id and goals.team_id = public.get_user_team_id())
);
create policy "Users can update own comments" on public.goal_comments for update using (profile_id = auth.uid());
create policy "Users can delete own comments" on public.goal_comments for delete using (profile_id = auth.uid());

-- Goal Activities
create policy "Team members can view activities" on public.goal_activities for select using (
  exists(select 1 from public.goals where goals.id = goal_activities.goal_id and goals.team_id = public.get_user_team_id())
);
create policy "Team members can log activities" on public.goal_activities for insert with check (
  exists(select 1 from public.goals where goals.id = goal_activities.goal_id and goals.team_id = public.get_user_team_id())
);

-- Daily Tasks
create policy "Users can view own tasks" on public.daily_tasks for select using (profile_id = auth.uid());
create policy "Users can create tasks" on public.daily_tasks for insert with check (profile_id = auth.uid());
create policy "Users can update own tasks" on public.daily_tasks for update using (profile_id = auth.uid());
create policy "Users can delete own tasks" on public.daily_tasks for delete using (profile_id = auth.uid());

-- Notifications
create policy "Users can view own notifications" on public.notifications for select using (profile_id = auth.uid());
create policy "System can create notifications" on public.notifications for insert with check (team_id = public.get_user_team_id());
create policy "Users can update own notifications" on public.notifications for update using (profile_id = auth.uid());

-- Integrations
create policy "Team members can view integrations" on public.integrations for select using (team_id = public.get_user_team_id());
create policy "Admins can manage integrations" on public.integrations for all using (team_id = public.get_user_team_id() and public.is_team_admin());

-- Help Articles: public read
create policy "Anyone can view help articles" on public.help_articles for select using (true);

-- ============================================
-- Enable Realtime
-- ============================================
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.goals;
alter publication supabase_realtime add table public.goal_comments;

-- ============================================
-- Seed Help Articles
-- ============================================
insert into public.help_articles (title, content, category, sort_order) values
('ゴールの作成方法', 'サイドバーの「ゴール」メニューから「新規ゴール作成」ボタンをクリックし、タイトル（「〜する」形式）、期日、完了基準を入力してください。', 'getting_started', 1),
('サブゴールの追加', 'ゴール詳細ページの「サブゴール追加」ボタンから、親ゴールに紐づくサブゴールを作成できます。ツリー構造で階層的に管理されます。', 'getting_started', 2),
('メンバーの招待', '設定ページの「メンバー管理」からメールアドレスを入力して招待を送信できます。招待されたメンバーはメール内のリンクからチームに参加できます。', 'team', 3),
('デイリータスクの使い方', '「実行」ページで今日やるべきタスクを管理できます。ゴールと紐付けることで、日々の作業がどのゴールに貢献しているか可視化されます。', 'execution', 4),
('通知の確認', 'サイドバーのベルアイコンから通知を確認できます。ゴールの割り当て、ステータス変更、コメント追加時に通知されます。', 'notifications', 5),
('ゴールのステータス管理', 'ゴールには「未着手」「進行中」「完了」「保留」の4つのステータスがあります。ステータスを変更すると活動履歴に記録されます。', 'goals', 6),
('組織階層の設定', 'メンバー管理からマネージャーを設定することで、組織の階層構造を反映できます。', 'team', 7),
('検索機能', 'ヘッダーの検索バーからゴールやメンバーを横断的に検索できます。キーワードを入力すると即座に結果が表示されます。', 'general', 8);
