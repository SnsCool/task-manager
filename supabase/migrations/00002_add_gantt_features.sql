-- ============================================
-- Add Gantt Chart Features
-- ============================================

-- Add start_date to goals table
alter table public.goals add column start_date date;

-- Backfill existing records: set start_date to created_at date
update public.goals set start_date = created_at::date where start_date is null;

-- Add indexes for date-based queries (Gantt chart performance)
create index idx_goals_start_date_due_date on public.goals(start_date, due_date);
create index idx_goals_team_status on public.goals(team_id, status);
