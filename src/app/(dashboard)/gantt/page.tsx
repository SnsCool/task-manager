'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Calendar, CalendarDays, CalendarRange } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth'
import { useGoalStore } from '@/stores/goals'
import { GanttChart } from '@/components/gantt/GanttChart'
import { GanttTaskForm } from '@/components/gantt/GanttTaskForm'
import { GanttToolbar, type SortKey, type StatusFilter, type PriorityFilter } from '@/components/gantt/GanttToolbar'
import { ContextMenu } from '@/components/gantt/ContextMenu'
import { Header } from '@/components/layout/Header'
import { getStatusColor, getStatusLabel } from '@/lib/gantt-utils'
import type { GanttTimeScale, Goal, GoalWithChildren } from '@/types'

const scaleOptions: { value: GanttTimeScale; label: string; icon: typeof Calendar }[] = [
  { value: 'day', label: '日', icon: Calendar },
  { value: 'week', label: '週', icon: CalendarDays },
  { value: 'month', label: '月', icon: CalendarRange },
]

const statusLegend: Goal['status'][] = ['not_started', 'in_progress', 'completed', 'on_hold']

export default function GanttPage() {
  const { team } = useAuthStore()
  const { goals, setGoals, setLoading, buildTree } = useGoalStore()
  const [scale, setScale] = useState<GanttTimeScale>('day')
  const [showForm, setShowForm] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [parentId, setParentId] = useState<string | null>(null)

  // Filter & sort state
  const [statusFilters, setStatusFilters] = useState<Set<StatusFilter>>(new Set())
  const [priorityFilters, setPriorityFilters] = useState<Set<PriorityFilter>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('created_at')

  // Expanded IDs state (lifted from GanttChart)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    goal: GoalWithChildren
  } | null>(null)

  const fetchGoals = useCallback(async () => {
    if (!team) return
    setLoading(true)
    try {
      const data = await apiFetch<Goal[]>('/api/goals')
      setGoals(data)
    } catch {
      // ignore
    }
    setLoading(false)
  }, [team, setGoals, setLoading])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const tree = buildTree(goals)

  // Initialize expanded IDs when tree changes
  useEffect(() => {
    setExpandedIds((prev) => {
      const ids = new Set(prev)
      const collectExpandable = (nodes: GoalWithChildren[]) => {
        nodes.forEach((n) => {
          if (n.children.length > 0 && !ids.has(n.id)) {
            ids.add(n.id)
          }
          collectExpandable(n.children)
        })
      }
      collectExpandable(tree)
      return ids
    })
  }, [tree])

  // Filter and sort goals
  const filteredGoals = useMemo(() => {
    let filtered = [...goals]

    // Apply status filters
    if (statusFilters.size > 0) {
      const matchingIds = new Set<string>()
      filtered.forEach((g) => {
        if (statusFilters.has(g.status)) {
          matchingIds.add(g.id)
          // Include parent chain for tree structure
          let current = g
          while (current.parent_id) {
            matchingIds.add(current.parent_id)
            const parent = filtered.find((p) => p.id === current.parent_id)
            if (!parent) break
            current = parent
          }
        }
      })
      filtered = filtered.filter((g) => matchingIds.has(g.id))
    }

    // Apply priority filters
    if (priorityFilters.size > 0) {
      const matchingIds = new Set<string>()
      filtered.forEach((g) => {
        if (priorityFilters.has(g.priority)) {
          matchingIds.add(g.id)
          let current = g
          while (current.parent_id) {
            matchingIds.add(current.parent_id)
            const parent = filtered.find((p) => p.id === current.parent_id)
            if (!parent) break
            current = parent
          }
        }
      })
      filtered = filtered.filter((g) => matchingIds.has(g.id))
    }

    // Apply sort
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    const statusOrder: Record<string, number> = { in_progress: 0, not_started: 1, on_hold: 2, completed: 3 }

    filtered.sort((a, b) => {
      switch (sortKey) {
        case 'due_date':
          return (a.due_date || '9999').localeCompare(b.due_date || '9999')
        case 'priority':
          return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9)
        case 'status':
          return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
        case 'created_at':
        default:
          return a.created_at.localeCompare(b.created_at)
      }
    })

    return filtered
  }, [goals, statusFilters, priorityFilters, sortKey])

  const filteredTree = buildTree(filteredGoals)

  const handleGoalClick = (goal: GoalWithChildren) => {
    setEditGoal(goal)
    setParentId(null)
    setShowForm(true)
  }

  const handleAddSubGoal = (pid: string) => {
    setEditGoal(null)
    setParentId(pid || null)
    setShowForm(true)
  }

  const handleNewGoal = () => {
    setEditGoal(null)
    setParentId(null)
    setShowForm(true)
  }

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleExpandAll = () => {
    const ids = new Set<string>()
    const collect = (nodes: GoalWithChildren[]) => {
      nodes.forEach((n) => {
        if (n.children.length > 0) {
          ids.add(n.id)
          collect(n.children)
        }
      })
    }
    collect(filteredTree)
    setExpandedIds(ids)
  }

  const handleCollapseAll = () => {
    setExpandedIds(new Set())
  }

  // Drag update handler (optimistic update + API save)
  const handleGoalUpdate = useCallback(async (goalId: string, updates: { start_date?: string; due_date?: string }) => {
    // Optimistic update
    setGoals(goals.map((g) => (g.id === goalId ? { ...g, ...updates } : g)))
    // Save via API
    await apiFetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }, [goals, setGoals])

  // Status change handler
  const handleStatusChange = useCallback(async (goalId: string, status: Goal['status']) => {
    setGoals(goals.map((g) => (g.id === goalId ? { ...g, status } : g)))
    await apiFetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }, [goals, setGoals])

  // Progress change handler
  const handleProgressChange = useCallback(async (goalId: string, progress: number) => {
    setGoals(goals.map((g) => (g.id === goalId ? { ...g, progress } : g)))
    await apiFetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      body: JSON.stringify({ progress }),
    })
  }, [goals, setGoals])

  // Context menu handler
  const handleContextMenu = useCallback((e: React.MouseEvent, goal: GoalWithChildren) => {
    setContextMenu({ x: e.clientX, y: e.clientY, goal })
  }, [])

  // Delete handler
  const handleDelete = useCallback(async (goalId: string) => {
    setGoals(goals.filter((g) => g.id !== goalId))
    await apiFetch(`/api/goals/${goalId}`, { method: 'DELETE' })
  }, [goals, setGoals])

  // Toggle status/priority filters
  const handleToggleStatus = (s: StatusFilter) => {
    setStatusFilters((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  const handleTogglePriority = (p: PriorityFilter) => {
    setPriorityFilters((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  return (
    <>
      <Header title="ガントチャート" />
      <div className="p-6 flex flex-col h-[calc(100vh-64px)]">
        {/* Top toolbar row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {scaleOptions.map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    onClick={() => setScale(opt.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      scale === opt.value
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Icon size={14} />
                    {opt.label}
                  </button>
                )
              })}
            </div>
            <span className="text-sm text-gray-500 ml-2">
              {filteredGoals.length}/{goals.length}個のタスク
            </span>

            {/* Status legend */}
            <div className="flex items-center gap-2 ml-4">
              {statusLegend.map((s) => (
                <div key={s} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(s)}`} />
                  <span className="text-[11px] text-gray-400">{getStatusLabel(s)}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleNewGoal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            新規タスク
          </button>
        </div>

        {/* Filter/Sort toolbar */}
        <div className="mb-3">
          <GanttToolbar
            statusFilters={statusFilters}
            priorityFilters={priorityFilters}
            sortKey={sortKey}
            onToggleStatus={handleToggleStatus}
            onTogglePriority={handleTogglePriority}
            onSortChange={setSortKey}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
          />
        </div>

        {/* Gantt Chart */}
        <div className="flex-1 min-h-0">
          {goals.length === 0 ? (
            <div className="flex items-center justify-center h-full bg-white rounded-xl border border-gray-200">
              <div className="text-center">
                <CalendarRange size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm mb-3">タスクがありません</p>
                <button
                  onClick={handleNewGoal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  最初のタスクを作成
                </button>
              </div>
            </div>
          ) : (
            <GanttChart
              goals={filteredTree}
              allGoals={filteredGoals}
              scale={scale}
              expandedIds={expandedIds}
              onToggle={handleToggle}
              onGoalClick={handleGoalClick}
              onAddSubGoal={handleAddSubGoal}
              onGoalUpdate={handleGoalUpdate}
              onStatusChange={handleStatusChange}
              onProgressChange={handleProgressChange}
              onContextMenu={handleContextMenu}
            />
          )}
        </div>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <GanttTaskForm
          parentId={parentId}
          goal={editGoal}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchGoals() }}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={() => {
            handleGoalClick(contextMenu.goal)
            setContextMenu(null)
          }}
          onDelete={() => {
            handleDelete(contextMenu.goal.id)
            setContextMenu(null)
          }}
          onAddSubTask={() => {
            handleAddSubGoal(contextMenu.goal.id)
            setContextMenu(null)
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  )
}
