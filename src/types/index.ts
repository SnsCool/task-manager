// Core entity types
export type Team = {
  id: string
  name: string
  logo_url: string | null
  created_at: string
  updated_at: string
  // Prisma camelCase aliases
  logoUrl?: string | null
  createdAt?: string
  updatedAt?: string
}

export type Profile = {
  id: string
  user_id?: string
  team_id: string | null
  full_name: string
  email: string
  avatar_url: string | null
  role: 'admin' | 'member'
  manager_id: string | null
  created_at: string
  updated_at: string
  // Prisma camelCase aliases
  userId?: string
  teamId?: string | null
  fullName?: string
  avatarUrl?: string | null
  managerId?: string | null
  createdAt?: string
  updatedAt?: string
  team?: Team | null
}

export type TeamInvitation = {
  id: string
  team_id: string
  email: string
  role: 'admin' | 'member'
  token: string
  invited_by: string
  status: 'pending' | 'accepted' | 'expired'
  expires_at: string
  created_at: string
  // Prisma camelCase aliases
  teamId?: string
  invitedBy?: string
  expiresAt?: string
  createdAt?: string
}

export type Goal = {
  id: string
  team_id: string
  parent_id: string | null
  title: string
  description: string | null
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold'
  priority: 'low' | 'medium' | 'high'
  start_date: string | null
  due_date: string | null
  completion_criteria: string | null
  progress: number
  created_by: string
  path: string
  depth: number
  created_at: string
  updated_at: string
  // Prisma camelCase aliases
  teamId?: string
  parentId?: string | null
  startDate?: string | null
  dueDate?: string | null
  completionCriteria?: string | null
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export type GoalAssignee = {
  id: string
  goal_id: string
  profile_id: string
  assigned_at: string
  assigned_by: string
  // Prisma camelCase aliases
  goalId?: string
  profileId?: string
  assignedAt?: string
  assignedBy?: string
  profile?: Profile
}

export type GoalComment = {
  id: string
  goal_id: string
  profile_id: string
  content: string
  created_at: string
  updated_at: string
  // Prisma camelCase aliases
  goalId?: string
  profileId?: string
  createdAt?: string
  updatedAt?: string
}

export type GoalActivity = {
  id: string
  goal_id: string
  profile_id: string
  action: 'created' | 'updated' | 'status_changed' | 'comment_added' | 'assignee_added' | 'assignee_removed'
  details: Record<string, unknown> | null
  created_at: string
  // Prisma camelCase aliases
  goalId?: string
  profileId?: string
  createdAt?: string
}

export type DailyTask = {
  id: string
  team_id: string
  profile_id: string
  title: string
  is_completed: boolean
  goal_id: string | null
  due_date: string
  sort_order: number
  created_at: string
  updated_at: string
  // Prisma camelCase aliases
  teamId?: string
  profileId?: string
  isCompleted?: boolean
  goalId?: string | null
  dueDate?: string
  sortOrder?: number
  createdAt?: string
  updatedAt?: string
  goal?: Goal | null
  goals?: Goal | null
}

export type Notification = {
  id: string
  team_id: string
  profile_id: string
  type: 'goal_assigned' | 'goal_updated' | 'comment_added' | 'invitation' | 'reminder'
  title: string
  message: string
  is_read: boolean
  related_goal_id: string | null
  related_profile_id: string | null
  created_at: string
  // Prisma camelCase aliases
  teamId?: string
  profileId?: string
  isRead?: boolean
  relatedGoalId?: string | null
  relatedProfileId?: string | null
  createdAt?: string
}

export type Integration = {
  id: string
  team_id: string
  service_name: string
  is_connected: boolean
  config: Record<string, unknown> | null
  created_at: string
  updated_at: string
  // Prisma camelCase aliases
  teamId?: string
  serviceName?: string
  isConnected?: boolean
  createdAt?: string
  updatedAt?: string
}

export type HelpArticle = {
  id: string
  title: string
  content: string
  category: string
  sort_order: number
  created_at: string
  updated_at: string
  // Prisma camelCase aliases
  sortOrder?: number
  createdAt?: string
  updatedAt?: string
}

// Composite types
export type GoalWithChildren = Goal & {
  children: GoalWithChildren[]
}

export type ProfileWithManager = Profile & {
  manager?: Profile | null
}

export type GoalCommentWithProfile = GoalComment & {
  profiles?: Profile
  profile?: Profile
}

export type GoalActivityWithProfile = GoalActivity & {
  profiles?: Profile
  profile?: Profile
}

export type GoalDetail = Goal & {
  assignees: (GoalAssignee & { profiles?: Profile; profile?: Profile })[]
  goal_comments?: GoalCommentWithProfile[]
  goal_activities?: GoalActivityWithProfile[]
  comments?: GoalCommentWithProfile[]
  activities?: GoalActivityWithProfile[]
  children?: Goal[]
}

export type GoalInsert = Partial<Goal> & { title: string }
export type GoalUpdate = Partial<Goal>
export type DailyTaskInsert = Partial<DailyTask> & { title: string }
export type DailyTaskUpdate = Partial<DailyTask>
export type ProfileUpdate = Partial<Profile>
export type NotificationInsert = Partial<Notification> & { title: string; message: string; type: Notification['type'] }

// Gantt Chart types
export type GanttTimeScale = 'day' | 'week' | 'month'

export type GanttTask = Goal & {
  barStartX: number
  barWidth: number
  rowIndex: number
}

export type TimelineRange = {
  start: Date
  end: Date
  totalDays: number
}
