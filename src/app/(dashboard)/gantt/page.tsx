'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Calendar, CalendarDays, CalendarRange } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { useGoalStore } from '@/stores/goals'
import { GanttChart } from '@/components/gantt/GanttChart'
import { GanttTaskForm } from '@/components/gantt/GanttTaskForm'
import { Header } from '@/components/layout/Header'
import type { GanttTimeScale, Goal, GoalWithChildren } from '@/types'

const scaleOptions: { value: GanttTimeScale; label: string; icon: typeof Calendar }[] = [
  { value: 'day', label: '日', icon: Calendar },
  { value: 'week', label: '週', icon: CalendarDays },
  { value: 'month', label: '月', icon: CalendarRange },
]

export default function GanttPage() {
  const supabase = createClient()
  const { team } = useAuthStore()
  const { goals, setGoals, setLoading, buildTree } = useGoalStore()
  const [scale, setScale] = useState<GanttTimeScale>('day')
  const [showForm, setShowForm] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [parentId, setParentId] = useState<string | null>(null)

  const fetchGoals = useCallback(async () => {
    if (!team) return
    setLoading(true)
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('team_id', team.id)
      .order('created_at', { ascending: true })
    if (data) setGoals(data)
    setLoading(false)
  }, [team, supabase, setGoals, setLoading])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const tree = buildTree(goals)

  const handleGoalClick = (goal: GoalWithChildren) => {
    setEditGoal(goal)
    setParentId(null)
    setShowForm(true)
  }

  const handleAddSubGoal = (pid: string) => {
    setEditGoal(null)
    setParentId(pid)
    setShowForm(true)
  }

  const handleNewGoal = () => {
    setEditGoal(null)
    setParentId(null)
    setShowForm(true)
  }

  return (
    <>
      <Header title="ガントチャート" />
      <div className="p-6 flex flex-col h-[calc(100vh-64px)]">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
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
            <span className="text-sm text-gray-500 ml-2">{goals.length}個のタスク</span>
          </div>
          <button
            onClick={handleNewGoal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            新規タスク
          </button>
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
              goals={tree}
              allGoals={goals}
              scale={scale}
              onGoalClick={handleGoalClick}
              onAddSubGoal={handleAddSubGoal}
            />
          )}
        </div>
      </div>

      {showForm && (
        <GanttTaskForm
          parentId={parentId}
          goal={editGoal}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchGoals() }}
        />
      )}
    </>
  )
}
