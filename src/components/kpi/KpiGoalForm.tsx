'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { GoalType } from '@/types'

const goalTypeLabels: Record<GoalType, string> = {
  kgi: 'KGI（経営目標）',
  kpi: 'KPI（重要業績指標）',
  issue: '課題',
  task: 'タスク',
}

const goalTypeDescriptions: Record<GoalType, string> = {
  kgi: '組織全体の最終目標を設定します',
  kpi: 'KGIを達成するための計測可能な指標を設定します',
  issue: 'KPI達成のために解決すべき課題を設定します',
  task: '課題を解決するための具体的なアクションを設定します',
}

type Props = {
  parentId?: string | null
  goalType: GoalType
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  onClose: () => void
}

export function KpiGoalForm({ parentId, goalType, onSubmit, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('medium')
  const [metricName, setMetricName] = useState('')
  const [metricUnit, setMetricUnit] = useState('')
  const [metricTarget, setMetricTarget] = useState('')
  const [periodType, setPeriodType] = useState('')
  const [completionCriteria, setCompletionCriteria] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const showMetrics = goalType === 'kgi' || goalType === 'kpi'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    setError('')

    try {
      await onSubmit({
        parent_id: parentId || null,
        title: title.trim(),
        description: description.trim() || null,
        goal_type: goalType,
        start_date: startDate || null,
        due_date: dueDate || null,
        priority,
        completion_criteria: completionCriteria.trim() || null,
        ...(showMetrics && {
          metric_name: metricName.trim() || null,
          metric_unit: metricUnit.trim() || null,
          metric_target: metricTarget ? parseFloat(metricTarget) : null,
          period_type: periodType || null,
        }),
      })
      onClose()
    } catch {
      setError('作成に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-900">
              {goalTypeLabels[goalType]}を作成
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {goalTypeDescriptions[goalType]}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={
                goalType === 'kgi'
                  ? '例: 年間売上10億円達成'
                  : goalType === 'kpi'
                    ? '例: 月次新規契約数40件'
                    : goalType === 'issue'
                      ? '例: リード獲得数が不足'
                      : '例: LP改善のA/Bテスト実施'
              }
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Metrics (KGI/KPI only) */}
          {showMetrics && (
            <div className="bg-blue-50 rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold text-blue-700">計測指標の設定</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">指標名</label>
                  <input
                    type="text"
                    value={metricName}
                    onChange={(e) => setMetricName(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 月次売上"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">目標値</label>
                  <input
                    type="number"
                    value={metricTarget}
                    onChange={(e) => setMetricTarget(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">単位</label>
                  <input
                    type="text"
                    value={metricUnit}
                    onChange={(e) => setMetricUnit(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 件, 円, %"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">計測期間</label>
                <select
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                >
                  <option value="">選択してください</option>
                  <option value="monthly">月次</option>
                  <option value="quarterly">四半期</option>
                  <option value="yearly">年次</option>
                  <option value="custom">カスタム</option>
                </select>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期限</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">優先度</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>

          {/* Completion Criteria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">達成基準</label>
            <textarea
              value={completionCriteria}
              onChange={(e) => setCompletionCriteria(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="この項目が達成されたと判断する基準を記入"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {submitting ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
