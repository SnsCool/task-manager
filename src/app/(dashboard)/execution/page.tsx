'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Check, Trash2, BarChart3, Target, ChevronDown, ChevronRight, FileText } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth'
import { Header } from '@/components/layout/Header'
import { ExecutionLogDialog } from '@/components/kpi/ExecutionLogDialog'
import type { DailyTask, Goal } from '@/types'

type TaskWithGoal = DailyTask & { goal?: Goal | null }

type KpiGroup = {
  kpi: Goal | null
  label: string
  tasks: TaskWithGoal[]
}

export default function ExecutionPage() {
  const { user, team } = useAuthStore()
  const [tasks, setTasks] = useState<TaskWithGoal[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [kpiGoals, setKpiGoals] = useState<Goal[]>([])
  const [issueGoals, setIssueGoals] = useState<Goal[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newGoalId, setNewGoalId] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['all']))
  const [logDialog, setLogDialog] = useState<{ taskId: string; title: string; goalId: string | null } | null>(null)
  const today = new Date().toISOString().split('T')[0]

  const fetchTasks = useCallback(async () => {
    if (!user) return
    try {
      const data = await apiFetch<TaskWithGoal[]>(`/api/daily-tasks?date=${today}`)
      setTasks(data)
    } catch {
      // ignore
    }
    setLoading(false)
  }, [user, today])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    if (!team) return
    const fetchGoals = async () => {
      try {
        const data = await apiFetch<Goal[]>('/api/goals')
        setGoals(data.filter((g) => g.status !== 'completed'))
        setKpiGoals(data.filter((g) => (g.goalType || g.goal_type) === 'kpi'))
        setIssueGoals(data.filter((g) => (g.goalType || g.goal_type) === 'issue'))
      } catch {
        // ignore
      }
    }
    fetchGoals()
  }, [team])

  // Group tasks by their KPI
  const groupTasksByKpi = (): KpiGroup[] => {
    const groups = new Map<string, KpiGroup>()

    for (const task of tasks) {
      const goal = task.goal || task.goals
      let kpiId = 'no-kpi'
      let kpi: Goal | null = null

      if (goal) {
        // Find the KPI ancestor
        const goalType = goal.goalType || goal.goal_type
        if (goalType === 'kpi') {
          kpiId = goal.id
          kpi = goal
        } else if (goalType === 'issue' && goal.parentId) {
          // Issue's parent is the KPI
          const parentKpi = kpiGoals.find((k) => k.id === (goal.parentId || goal.parent_id))
          if (parentKpi) {
            kpiId = parentKpi.id
            kpi = parentKpi
          }
        } else if (goalType === 'task' && goal.path) {
          // Try to find KPI from path
          const pathParts = (goal.path || '').split('.')
          for (const partId of pathParts) {
            const found = kpiGoals.find((k) => k.id === partId)
            if (found) {
              kpiId = found.id
              kpi = found
              break
            }
          }
        }
      }

      if (!groups.has(kpiId)) {
        groups.set(kpiId, {
          kpi,
          label: kpi ? kpi.title : 'KPI未紐付け',
          tasks: [],
        })
      }
      groups.get(kpiId)!.tasks.push(task)
    }

    // Sort: KPI groups first, then unlinked
    const sorted = Array.from(groups.values())
    sorted.sort((a, b) => {
      if (a.kpi && !b.kpi) return -1
      if (!a.kpi && b.kpi) return 1
      return 0
    })

    return sorted
  }

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !user || !team) return
    await apiFetch('/api/daily-tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: newTitle.trim(),
        goal_id: newGoalId || null,
        due_date: today,
        sort_order: tasks.length,
      }),
    })
    setNewTitle('')
    setNewGoalId('')
    fetchTasks()
  }

  const toggleTask = async (task: DailyTask) => {
    const wasCompleted = task.is_completed || task.isCompleted
    await apiFetch(`/api/daily-tasks/${task.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_completed: !wasCompleted }),
    })

    // Show execution log dialog when completing a task
    if (!wasCompleted) {
      setLogDialog({
        taskId: task.id,
        title: task.title,
        goalId: task.goal_id || task.goalId || null,
      })
    }

    fetchTasks()
  }

  const deleteTask = async (id: string) => {
    await apiFetch(`/api/daily-tasks/${id}`, { method: 'DELETE' })
    fetchTasks()
  }

  const completedCount = tasks.filter((t) => t.is_completed || t.isCompleted).length
  const groups = groupTasksByKpi()

  return (
    <>
      <Header title="実行" />
      <div className="p-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">今日のタスク</h3>
            <p className="text-sm text-gray-500">
              {today} ・ {completedCount}/{tasks.length} 完了
            </p>
          </div>
          {tasks.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {Math.round(tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0)}%
              </span>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{
                    width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Add Task Form — KPI紐付け対応 */}
        <form onSubmit={addTask} className="mb-6 bg-white rounded-xl border p-4">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="新しいタスクを追加..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex gap-2">
            <select
              value={newGoalId}
              onChange={(e) => setNewGoalId(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600"
            >
              <option value="">課題/ゴールを選択（KPI紐付け）</option>
              {issueGoals.length > 0 && (
                <optgroup label="📋 課題">
                  {issueGoals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </optgroup>
              )}
              {kpiGoals.length > 0 && (
                <optgroup label="📊 KPI">
                  {kpiGoals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </optgroup>
              )}
              {goals.filter((g) => {
                const gt = g.goalType || g.goal_type
                return gt !== 'kpi' && gt !== 'issue' && gt !== 'kgi'
              }).length > 0 && (
                <optgroup label="🎯 その他のゴール">
                  {goals
                    .filter((g) => {
                      const gt = g.goalType || g.goal_type
                      return gt !== 'kpi' && gt !== 'issue' && gt !== 'kgi'
                    })
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>
        </form>

        {/* Task List — Grouped by KPI */}
        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Target size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">今日のタスクはありません</p>
            <p className="text-xs mt-1">上のフォームからタスクを追加しましょう</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const groupId = group.kpi?.id || 'no-kpi'
              const isExpanded = expandedGroups.has(groupId) || expandedGroups.has('all')
              const groupCompleted = group.tasks.filter(
                (t) => t.is_completed || t.isCompleted
              ).length

              return (
                <div key={groupId} className="bg-white rounded-xl border overflow-hidden">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(groupId)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={14} className="text-gray-400" />
                    )}
                    {group.kpi ? (
                      <BarChart3 size={14} className="text-blue-500" />
                    ) : (
                      <Target size={14} className="text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-700 flex-1 text-left truncate">
                      {group.label}
                    </span>
                    {group.kpi?.metricTarget != null && (
                      <span className="text-xs text-gray-400">
                        {group.kpi.metricCurrent ?? group.kpi.metric_current ?? 0}
                        {group.kpi.metricUnit ?? group.kpi.metric_unit ?? ''} / {group.kpi.metricTarget ?? group.kpi.metric_target}
                        {group.kpi.metricUnit ?? group.kpi.metric_unit ?? ''}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {groupCompleted}/{group.tasks.length}
                    </span>
                  </button>

                  {/* Tasks */}
                  {isExpanded && (
                    <div className="divide-y divide-gray-50">
                      {group.tasks.map((task) => {
                        const isCompleted = task.is_completed || task.isCompleted
                        const linkedGoal = task.goal || task.goals

                        return (
                          <div
                            key={task.id}
                            className={`flex items-center gap-3 px-4 py-2.5 group ${
                              isCompleted ? 'opacity-50' : ''
                            }`}
                          >
                            <button
                              onClick={() => toggleTask(task)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isCompleted
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-gray-300 hover:border-blue-500'
                              }`}
                            >
                              {isCompleted && <Check size={12} />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm ${isCompleted ? 'line-through text-gray-400' : ''}`}
                              >
                                {task.title}
                              </p>
                              {linkedGoal && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[10px] text-gray-400">
                                    ↳ {linkedGoal.title}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Log button */}
                            <button
                              onClick={() =>
                                setLogDialog({
                                  taskId: task.id,
                                  title: task.title,
                                  goalId: task.goal_id || task.goalId || null,
                                })
                              }
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-50 rounded text-blue-400"
                              title="実行ログを記録"
                            >
                              <FileText size={14} />
                            </button>

                            <button
                              onClick={() => deleteTask(task.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Execution Log Dialog */}
      {logDialog && (
        <ExecutionLogDialog
          taskId={logDialog.taskId}
          taskTitle={logDialog.title}
          relatedGoalId={logDialog.goalId}
          onClose={() => setLogDialog(null)}
          onSaved={fetchTasks}
        />
      )}
    </>
  )
}
