'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth'
import type { Goal } from '@/types'

interface GoalFormProps {
  parentId?: string | null
  goal?: Goal | null
  onClose: () => void
  onSaved: () => void
}

export function GoalForm({ parentId = null, goal = null, onClose, onSaved }: GoalFormProps) {
  const isEditing = !!goal
  const [title, setTitle] = useState(goal?.title || '')
  const [description, setDescription] = useState(goal?.description || '')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(goal?.priority || 'medium')
  const [startDate, setStartDate] = useState(goal?.start_date || '')
  const [dueDate, setDueDate] = useState(goal?.due_date || '')
  const [completionCriteria, setCompletionCriteria] = useState(goal?.completion_criteria || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user, team } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !team) return
    setLoading(true)
    setError('')

    try {
      if (isEditing && goal) {
        await apiFetch(`/api/goals/${goal.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title,
            description: description || null,
            priority,
            start_date: startDate || null,
            due_date: dueDate || null,
            completion_criteria: completionCriteria || null,
          }),
        })
      } else {
        await apiFetch('/api/goals', {
          method: 'POST',
          body: JSON.stringify({
            title,
            description: description || null,
            priority,
            start_date: startDate || null,
            due_date: dueDate || null,
            completion_criteria: completionCriteria || null,
            parent_id: parentId,
          }),
        })
      }

      setLoading(false)
      onSaved()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '保存に失敗しました'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {isEditing ? 'ゴールを編集' : parentId ? 'サブゴールを作成' : '新規ゴール作成'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル <span className="text-gray-400">（「〜する」形式推奨）</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="例: 月間売上目標を達成する"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              placeholder="ゴールの詳細..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期日</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">優先度</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">完了基準</label>
            <textarea
              value={completionCriteria}
              onChange={(e) => setCompletionCriteria(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              placeholder="何をもって完了とするか..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
              キャンセル
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? '保存中...' : isEditing ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
