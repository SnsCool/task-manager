-- Add KPI hierarchy fields to goals
ALTER TABLE "goals" ADD COLUMN "goal_type" TEXT NOT NULL DEFAULT 'task';
ALTER TABLE "goals" ADD COLUMN "metric_name" TEXT;
ALTER TABLE "goals" ADD COLUMN "metric_unit" TEXT;
ALTER TABLE "goals" ADD COLUMN "metric_target" DOUBLE PRECISION;
ALTER TABLE "goals" ADD COLUMN "metric_current" DOUBLE PRECISION;
ALTER TABLE "goals" ADD COLUMN "period_type" TEXT;
ALTER TABLE "goals" ADD COLUMN "period_start" DATE;
ALTER TABLE "goals" ADD COLUMN "period_end" DATE;

-- Add KPI tracking fields to daily_tasks
ALTER TABLE "daily_tasks" ADD COLUMN "kpi_goal_id" UUID;
ALTER TABLE "daily_tasks" ADD COLUMN "estimated_hours" DOUBLE PRECISION;
ALTER TABLE "daily_tasks" ADD COLUMN "actual_hours" DOUBLE PRECISION;
ALTER TABLE "daily_tasks" ADD COLUMN "completed_at" TIMESTAMPTZ;
ALTER TABLE "daily_tasks" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "daily_tasks" ADD COLUMN "source_id" TEXT;
ALTER TABLE "daily_tasks" ADD COLUMN "confidence" DOUBLE PRECISION;

-- Create metric_snapshots table
CREATE TABLE "metric_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "goal_id" UUID NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "recorded_by" UUID,
    "note" TEXT,
    CONSTRAINT "metric_snapshots_pkey" PRIMARY KEY ("id")
);

-- Create execution_logs table
CREATE TABLE "execution_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" UUID,
    "profile_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "log_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "source_id" TEXT,
    "source_url" TEXT,
    "related_goal_id" UUID,
    "metric_impact" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "execution_logs_pkey" PRIMARY KEY ("id")
);

-- Add indexes
CREATE INDEX "idx_goals_team_goal_type" ON "goals"("team_id", "goal_type");
CREATE INDEX "idx_metric_snapshots_goal_recorded" ON "metric_snapshots"("goal_id", "recorded_at");
CREATE INDEX "idx_execution_logs_task_id" ON "execution_logs"("task_id");
CREATE INDEX "idx_execution_logs_profile_created" ON "execution_logs"("profile_id", "created_at");
CREATE INDEX "idx_execution_logs_team_created" ON "execution_logs"("team_id", "created_at");

-- Add foreign keys
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "daily_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_related_goal_id_fkey" FOREIGN KEY ("related_goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
