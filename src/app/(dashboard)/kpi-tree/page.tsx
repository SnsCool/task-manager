'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Target, RefreshCw } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth'
import { Header } from '@/components/layout/Header'
import { KpiTreeNodeComponent } from '@/components/kpi/KpiTreeNode'
import { KpiGoalForm } from '@/components/kpi/KpiGoalForm'
import type { KpiTreeNode, GoalType } from '@/types'

export default function KpiTreePage() {
  const { team } = useAuthStore()
  const [tree, setTree] = useState<KpiTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formParentId, setFormParentId] = useState<string | null>(null)
  const [formGoalType, setFormGoalType] = useState<GoalType>('kgi')

  const fetchTree = useCallback(async () => {
    if (!team) return
    try {
      const data = await apiFetch<KpiTreeNode[]>('/api/kpi-tree')
      setTree(data)
    } catch {
      // ignore
    }
    setLoading(false)
  }, [team])

  useEffect(() => {
    fetchTree()
  }, [fetchTree])

  const handleAddChild = (parentId: string, parentType: GoalType) => {
    const childTypeMap: Record<string, GoalType> = {
      kgi: 'kpi',
      kpi: 'issue',
      issue: 'task',
    }
    setFormParentId(parentId)
    setFormGoalType(childTypeMap[parentType] || 'task')
    setShowForm(true)
  }

  const handleAddKgi = () => {
    setFormParentId(null)
    setFormGoalType('kgi')
    setShowForm(true)
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    await apiFetch('/api/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    await fetchTree()
  }

  // Count stats
  const countByType = (nodes: KpiTreeNode[]): Record<string, number> => {
    const counts: Record<string, number> = { kgi: 0, kpi: 0, issue: 0, task: 0 }
    const traverse = (n: KpiTreeNode[]) => {
      for (const node of n) {
        const type = (node.goalType || node.goal_type || 'task') as string
        counts[type] = (counts[type] || 0) + 1
        if (node.children) traverse(node.children)
      }
    }
    traverse(nodes)
    return counts
  }

  const stats = countByType(tree)

  return (
    <>
      <Header title="KPIツリー" />
      <div className="p-6 max-w-5xl">
        {/* Header Stats */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-gray-600">KGI {stats.kgi}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-gray-600">KPI {stats.kpi}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-gray-600">課題 {stats.issue}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-gray-600">タスク {stats.task}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchTree}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
              title="更新"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={handleAddKgi}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              <Plus size={16} />
              KGIを作成
            </button>
          </div>
        </div>

        {/* Hierarchy Guide */}
        <div className="mb-4 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-700">階層構造:</span>{' '}
            <span className="text-purple-600 font-medium">KGI（経営目標）</span>
            {' → '}
            <span className="text-blue-600 font-medium">KPI（重要指標）</span>
            {' → '}
            <span className="text-amber-600 font-medium">課題</span>
            {' → '}
            <span className="text-green-600 font-medium">タスク</span>
            　｜　各ノードの「+」ボタンで下位要素を追加できます
          </p>
        </div>

        {/* Tree */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">読み込み中...</div>
        ) : tree.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Target size={56} className="mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium text-gray-500 mb-2">KPIツリーがありません</p>
            <p className="text-sm mb-6">
              まずKGI（経営目標）を作成して、KPI階層を構築しましょう
            </p>
            <button
              onClick={handleAddKgi}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              <Plus size={16} />
              最初のKGIを作成
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {tree.map((node) => (
              <KpiTreeNodeComponent
                key={node.id}
                node={node}
                onAddChild={handleAddChild}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <KpiGoalForm
          parentId={formParentId}
          goalType={formGoalType}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  )
}
