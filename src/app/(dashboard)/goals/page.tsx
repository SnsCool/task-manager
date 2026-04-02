'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth'
import { useGoalStore } from '@/stores/goals'
import { GoalTree } from '@/components/goals/GoalTree'
import { GoalForm } from '@/components/goals/GoalForm'
import { Header } from '@/components/layout/Header'
import type { Goal } from '@/types'

export default function GoalsPage() {
  const { team } = useAuthStore()
  const { goals, setGoals, setLoading, buildTree } = useGoalStore()
  const [showForm, setShowForm] = useState(false)
  const [parentId, setParentId] = useState<string | null>(null)

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

  const handleAddSubGoal = (pid: string) => {
    setParentId(pid)
    setShowForm(true)
  }

  return (
    <>
      <Header title="ゴール" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm text-gray-500">{goals.length}個のゴール</h3>
          </div>
          <button
            onClick={() => { setParentId(null); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            新規ゴール作成
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <GoalTree goals={tree} onAddSubGoal={handleAddSubGoal} />
        </div>
      </div>

      {showForm && (
        <GoalForm
          parentId={parentId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchGoals() }}
        />
      )}
    </>
  )
}
