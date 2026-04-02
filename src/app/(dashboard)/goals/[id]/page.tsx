'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Edit2, Trash2, Plus, Send,
  Target, Calendar, CheckCircle2, Clock, Pause, User,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth'
import { GoalForm } from '@/components/goals/GoalForm'
import type { Goal, GoalDetail, Profile } from '@/types'

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  not_started: { label: '未着手', color: 'bg-gray-100 text-gray-700', icon: Clock },
  in_progress: { label: '進行中', color: 'bg-blue-100 text-blue-700', icon: Target },
  completed: { label: '完了', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  on_hold: { label: '保留', color: 'bg-yellow-100 text-yellow-700', icon: Pause },
}

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, team } = useAuthStore()
  const [goal, setGoal] = useState<GoalDetail | null>(null)
  const [subGoals, setSubGoals] = useState<Goal[]>([])
  const [teamMembers, setTeamMembers] = useState<Profile[]>([])
  const [showEdit, setShowEdit] = useState(false)
  const [showSubGoalForm, setShowSubGoalForm] = useState(false)
  const [comment, setComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  const fetchGoal = useCallback(async () => {
    try {
      const data = await apiFetch<GoalDetail>(`/api/goals/${id}`)
      setGoal(data)
      // Sub goals are children with parent_id = id; fetch from goals list
      const allGoals = await apiFetch<Goal[]>('/api/goals')
      setSubGoals(allGoals.filter((g) => g.parent_id === id))
    } catch {
      // ignore
    }
  }, [id])

  useEffect(() => {
    fetchGoal()
  }, [fetchGoal])

  useEffect(() => {
    if (!team) return
    const fetchMembers = async () => {
      try {
        const data = await apiFetch<Profile[]>('/api/members')
        setTeamMembers(data)
      } catch {
        // ignore
      }
    }
    fetchMembers()
  }, [team])

  const updateStatus = async (status: string) => {
    if (!goal || !user) return
    await apiFetch(`/api/goals/${goal.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    fetchGoal()
  }

  const updateProgress = async (progress: number) => {
    if (!goal) return
    await apiFetch(`/api/goals/${goal.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ progress }),
    })
    fetchGoal()
  }

  const addAssignee = async (profileId: string) => {
    if (!goal || !user) return
    await apiFetch(`/api/goals/${goal.id}/assignees`, {
      method: 'POST',
      body: JSON.stringify({ profile_id: profileId }),
    })
    fetchGoal()
  }

  const removeAssignee = async (assigneeId: string) => {
    if (!goal || !user) return
    await apiFetch(`/api/goals/${goal.id}/assignees`, {
      method: 'DELETE',
      body: JSON.stringify({ assignee_id: assigneeId }),
    })
    fetchGoal()
  }

  const addComment = async () => {
    if (!comment.trim() || !goal || !user) return
    setSendingComment(true)
    await apiFetch(`/api/goals/${goal.id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content: comment.trim() }),
    })
    setComment('')
    setSendingComment(false)
    fetchGoal()
  }

  const deleteGoal = async () => {
    if (!goal) return
    await apiFetch(`/api/goals/${goal.id}`, { method: 'DELETE' })
    router.push('/goals')
  }

  if (!goal) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const assignedIds = new Set(goal.assignees?.map((a) => (a.profiles || a.profile)?.id).filter(Boolean) || [])
  const unassigned = teamMembers.filter((m) => !assignedIds.has(m.id))

  return (
    <>
      <div className="border-b border-gray-200 bg-white px-6 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/goals')} className="p-1 hover:bg-gray-100 rounded">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold flex-1 truncate">{goal.title}</h2>
        <button onClick={() => setShowEdit(true)} className="p-2 hover:bg-gray-100 rounded" title="編集">
          <Edit2 size={16} />
        </button>
        <button onClick={deleteGoal} className="p-2 hover:bg-red-50 text-red-500 rounded" title="削除">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Progress */}
          <div className="bg-white rounded-xl border p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusConfig).map(([key, { label, color }]) => (
                <button
                  key={key}
                  onClick={() => updateStatus(key)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    goal.status === key ? color : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">進捗</span>
                <span className="text-sm font-medium">{goal.progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={goal.progress}
                onChange={(e) => updateProgress(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>

          {/* Description */}
          {goal.description && (
            <div className="bg-white rounded-xl border p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">説明</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{goal.description}</p>
            </div>
          )}

          {goal.completion_criteria && (
            <div className="bg-white rounded-xl border p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">完了基準</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{goal.completion_criteria}</p>
            </div>
          )}

          {/* Sub Goals */}
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">サブゴール ({subGoals.length})</h4>
              <button
                onClick={() => setShowSubGoalForm(true)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus size={14} /> 追加
              </button>
            </div>
            {subGoals.length === 0 ? (
              <p className="text-sm text-gray-400">サブゴールはありません</p>
            ) : (
              <div className="space-y-1">
                {subGoals.map((sg) => (
                  <button
                    key={sg.id}
                    onClick={() => router.push(`/goals/${sg.id}`)}
                    className="w-full text-left flex items-center gap-2 p-2 rounded hover:bg-gray-50"
                  >
                    <Target size={14} className="text-gray-400 shrink-0" />
                    <span className="text-sm truncate">{sg.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      statusConfig[sg.status]?.color || ''
                    }`}>
                      {statusConfig[sg.status]?.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="bg-white rounded-xl border p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              コメント ({goal.goal_comments?.length || 0})
            </h4>
            <div className="space-y-3 mb-4">
              {(goal.goal_comments || []).map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                    {c.profiles?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.profiles?.full_name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(c.created_at).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && addComment()}
                placeholder="コメントを入力..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addComment}
                disabled={sendingComment || !comment.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

          {/* Activity */}
          <div className="bg-white rounded-xl border p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">活動履歴</h4>
            <div className="space-y-2">
              {(goal.goal_activities || [])
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-sm">
                    <span className="text-gray-400 text-xs mt-0.5 shrink-0 w-32">
                      {new Date(a.created_at).toLocaleString('ja-JP')}
                    </span>
                    <span className="text-gray-600">
                      <strong>{a.profiles?.full_name}</strong>
                      {a.action === 'created' && ' がゴールを作成'}
                      {a.action === 'updated' && ' がゴールを更新'}
                      {a.action === 'status_changed' && ` がステータスを変更`}
                      {a.action === 'comment_added' && ' がコメントを追加'}
                      {a.action === 'assignee_added' && ' が担当者を追加'}
                      {a.action === 'assignee_removed' && ' が担当者を削除'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">詳細</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-gray-500">期日:</span>
                <span>{goal.due_date || '未設定'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target size={14} className="text-gray-400" />
                <span className="text-gray-500">優先度:</span>
                <span className="capitalize">{
                  goal.priority === 'high' ? '高' : goal.priority === 'medium' ? '中' : '低'
                }</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              担当者 ({goal.assignees?.length || 0})
            </h4>
            <div className="space-y-2 mb-3">
              {(goal.assignees || []).map((a) => (
                <div key={a.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                      {a.profiles?.full_name?.charAt(0)}
                    </div>
                    <span className="text-sm">{a.profiles?.full_name}</span>
                  </div>
                  <button
                    onClick={() => removeAssignee(a.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
            {unassigned.length > 0 && (
              <select
                onChange={(e) => { if (e.target.value) addAssignee(e.target.value); e.target.value = '' }}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                defaultValue=""
              >
                <option value="" disabled>担当者を追加...</option>
                {unassigned.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {showEdit && (
        <GoalForm
          goal={goal}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); fetchGoal() }}
        />
      )}

      {showSubGoalForm && (
        <GoalForm
          parentId={id}
          onClose={() => setShowSubGoalForm(false)}
          onSaved={() => { setShowSubGoalForm(false); fetchGoal() }}
        />
      )}
    </>
  )
}
