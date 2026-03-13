export type Database = {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['teams']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          team_id: string | null
          full_name: string
          email: string
          avatar_url: string | null
          role: 'admin' | 'member'
          manager_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          team_id?: string | null
          full_name: string
          email: string
          avatar_url?: string | null
          role?: 'admin' | 'member'
          manager_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      team_invitations: {
        Row: {
          id: string
          team_id: string
          email: string
          role: 'admin' | 'member'
          token: string
          invited_by: string
          status: 'pending' | 'accepted' | 'expired'
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          email: string
          role?: 'admin' | 'member'
          token?: string
          invited_by: string
          status?: 'pending' | 'accepted' | 'expired'
          expires_at?: string
        }
        Update: Partial<Database['public']['Tables']['team_invitations']['Insert']>
      }
      goals: {
        Row: {
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
        }
        Insert: {
          id?: string
          team_id: string
          parent_id?: string | null
          title: string
          description?: string | null
          status?: 'not_started' | 'in_progress' | 'completed' | 'on_hold'
          priority?: 'low' | 'medium' | 'high'
          start_date?: string | null
          due_date?: string | null
          completion_criteria?: string | null
          progress?: number
          created_by: string
          path?: string
          depth?: number
        }
        Update: Partial<Database['public']['Tables']['goals']['Insert']>
      }
      goal_assignees: {
        Row: {
          id: string
          goal_id: string
          profile_id: string
          assigned_at: string
          assigned_by: string
        }
        Insert: {
          id?: string
          goal_id: string
          profile_id: string
          assigned_by: string
        }
        Update: Partial<Database['public']['Tables']['goal_assignees']['Insert']>
      }
      goal_comments: {
        Row: {
          id: string
          goal_id: string
          profile_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          profile_id: string
          content: string
        }
        Update: Partial<Database['public']['Tables']['goal_comments']['Insert']>
      }
      goal_activities: {
        Row: {
          id: string
          goal_id: string
          profile_id: string
          action: 'created' | 'updated' | 'status_changed' | 'comment_added' | 'assignee_added' | 'assignee_removed'
          details: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          profile_id: string
          action: 'created' | 'updated' | 'status_changed' | 'comment_added' | 'assignee_added' | 'assignee_removed'
          details?: Record<string, unknown> | null
        }
        Update: Partial<Database['public']['Tables']['goal_activities']['Insert']>
      }
      daily_tasks: {
        Row: {
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
        }
        Insert: {
          id?: string
          team_id: string
          profile_id: string
          title: string
          is_completed?: boolean
          goal_id?: string | null
          due_date?: string
          sort_order?: number
        }
        Update: Partial<Database['public']['Tables']['daily_tasks']['Insert']>
      }
      notifications: {
        Row: {
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
        }
        Insert: {
          id?: string
          team_id: string
          profile_id: string
          type: 'goal_assigned' | 'goal_updated' | 'comment_added' | 'invitation' | 'reminder'
          title: string
          message: string
          is_read?: boolean
          related_goal_id?: string | null
          related_profile_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      integrations: {
        Row: {
          id: string
          team_id: string
          service_name: string
          is_connected: boolean
          config: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          service_name: string
          is_connected?: boolean
          config?: Record<string, unknown> | null
        }
        Update: Partial<Database['public']['Tables']['integrations']['Insert']>
      }
      help_articles: {
        Row: {
          id: string
          title: string
          content: string
          category: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          category: string
          sort_order?: number
        }
        Update: Partial<Database['public']['Tables']['help_articles']['Insert']>
      }
    }
  }
}

// Convenience type aliases
export type Team = Database['public']['Tables']['teams']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type TeamInvitation = Database['public']['Tables']['team_invitations']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type GoalAssignee = Database['public']['Tables']['goal_assignees']['Row']
export type GoalComment = Database['public']['Tables']['goal_comments']['Row']
export type GoalActivity = Database['public']['Tables']['goal_activities']['Row']
export type DailyTask = Database['public']['Tables']['daily_tasks']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Integration = Database['public']['Tables']['integrations']['Row']
export type HelpArticle = Database['public']['Tables']['help_articles']['Row']

// Composite types
export type GoalWithChildren = Goal & {
  children: GoalWithChildren[]
}

export type ProfileWithManager = Profile & {
  manager?: Profile | null
}

export type GoalCommentWithProfile = GoalComment & {
  profiles: Profile
}

export type GoalActivityWithProfile = GoalActivity & {
  profiles: Profile
}

export type GoalDetail = Goal & {
  assignees: (GoalAssignee & { profiles: Profile })[]
  goal_comments: GoalCommentWithProfile[]
  goal_activities: GoalActivityWithProfile[]
}

export type GoalInsert = Database['public']['Tables']['goals']['Insert']
export type GoalUpdate = Database['public']['Tables']['goals']['Update']
export type DailyTaskInsert = Database['public']['Tables']['daily_tasks']['Insert']
export type DailyTaskUpdate = Database['public']['Tables']['daily_tasks']['Update']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

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
