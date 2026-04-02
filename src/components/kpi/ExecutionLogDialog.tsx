'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'

type Props = {
  taskId: string
  taskTitle: string
  relatedGoalId?: string | null
  onClose: () => void
  onSaved: () => void
}

export function ExecutionLogDialog({
  taskId,
  taskTitle,
  relatedGoalId,
  onClose,
  onSaved,
}: Props) {
  const [content, setContent] = useState('')
  const [logType, setLogType] = useState('completion')
  const [actualHours, setActualHours] = useState('')
  const [metricImpact, setMetricImpact] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setSubmitting(true)
    try {
      await apiFetch('/api/execution-logs', {
        method: 'POST',
        body: JSON.stringify({
          task_id: taskId,
          log_type: logType,
          content: content.trim(),
          related_goal_id: relatedGoalId || null,
          metric_impact: metricImpact ? parseFloat(metricImpact) : null,
        }),
      })

      // Update actual hours if provided
      if (actualHours) {
        await apiFetch(`/api/daily-tasks/${taskId}`, {
          method: 'PATCH',
          body: JSON.stringify({ actual_hours: parseFloat(actualHours) }),
        })
      }

      onSaved()
      onClose()
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">実行ログを記録</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[300px]">{taskTitle}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Log Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">種別</label>
            <select
              value={logType}
              onChange={(e) => setLogType(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="completion">完了報告</option>
              <option value="progress">進捗メモ</option>
              <option value="blocker">ブロッカー</option>
              <option value="note">メモ</option>
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="何をしたか、結果はどうだったか..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Actual Hours */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                所要時間（h）
              </label>
              <input
                type="number"
                step="0.5"
                value={actualHours}
                onChange={(e) => setActualHours(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 1.5"
              />
            </div>

            {/* Metric Impact */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                KPI影響値
              </label>
              <input
                type="number"
                step="0.1"
                value={metricImpact}
                onChange={(e) => setMetricImpact(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: +5"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              スキップ
            </button>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="px-4 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
