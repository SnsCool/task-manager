'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Check, Trash2, Link as LinkIcon, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { Header } from '@/components/layout/Header'
import type { DailyTask, Goal } from '@/types'

export default function ExecutionPage() {
  const supabase = createClient()
  const { user, team } = useAuthStore()
  const [tasks, setTasks] = useState<(DailyTask & { goals?: Goal | null })[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newGoalId, setNewGoalId] = useState('')
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  const fetchTasks = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('daily_tasks')
      .select('*, goals(*)')
      .eq('profile_id', user.id)
      .eq('due_date', today)
      .order('sort_order')
    if (data) setTasks(data as (DailyTask & { goals?: Goal | null })[])
    setLoading(false)
  }, [user, supabase, today])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    if (!team) return
    const fetchGoals = async () => {
      const { data } = await supabase
        .from('goals')
        .select('*')
        .eq('team_id', team.id)
        .neq('status', 'completed')
        .order('title')
      if (data) setGoals(data)
    }
    fetchGoals()
  }, [team, supabase])

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !user || !team) return
    await supabase.from('daily_tasks').insert({
      team_id: team.id,
      profile_id: user.id,
      title: newTitle.trim(),
      goal_id: newGoalId || null,
      due_date: today,
      sort_order: tasks.length,
    })
    setNewTitle('')
    setNewGoalId('')
    fetchTasks()
  }

  const toggleTask = async (task: DailyTask) => {
    await supabase
      .from('daily_tasks')
      .update({ is_completed: !task.is_completed })
      .eq('id', task.id)
    fetchTasks()
  }

  const deleteTask = async (id: string) => {
    await supabase.from('daily_tasks').delete().eq('id', id)
    fetchTasks()
  }

  const completedCount = tasks.filter((t) => t.is_completed).length

  return (
    <>
      <Header title="実行" />
      <div className="p-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">今日のタスク</h3>
            <p className="text-sm text-gray-500">{today} ・ {completedCount}/{tasks.length} 完了</p>
          </div>
          {tasks.length > 0 && (
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }}
              />
            </div>
          )}
        </div>

        {/* Add Task Form */}
        <form onSubmit={addTask} className="mb-6 bg-white rounded-xl border p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="新しいタスクを追加..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newGoalId}
              onChange={(e) => setNewGoalId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm max-w-48"
            >
              <option value="">ゴール紐付けなし</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={16} />
            </button>
          </div>
        </form>

        {/* Task List */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Target size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">今日のタスクはありません</p>
              <p className="text-xs mt-1">上のフォームからタスクを追加しましょう</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white rounded-lg border p-3 flex items-center gap-3 group ${
                  task.is_completed ? 'opacity-60' : ''
                }`}
              >
                <button
                  onClick={() => toggleTask(task)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    task.is_completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {task.is_completed && <Check size={12} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.is_completed ? 'line-through text-gray-400' : ''}`}>
                    {task.title}
                  </p>
                  {task.goals && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <LinkIcon size={10} className="text-blue-400" />
                      <span className="text-xs text-blue-500 truncate">{task.goals.title}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
