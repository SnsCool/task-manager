'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Plus, Target } from 'lucide-react'
import type { GoalWithChildren } from '@/types'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  not_started: 'bg-gray-200 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
}

const statusLabels: Record<string, string> = {
  not_started: '未着手',
  in_progress: '進行中',
  completed: '完了',
  on_hold: '保留',
}

const priorityColors: Record<string, string> = {
  low: 'text-gray-400',
  medium: 'text-yellow-500',
  high: 'text-red-500',
}

function GoalNode({
  goal,
  onAddSubGoal,
}: {
  goal: GoalWithChildren
  onAddSubGoal: (parentId: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = goal.children.length > 0

  return (
    <div>
      <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 group">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-5 h-5 flex items-center justify-center shrink-0"
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          )}
        </button>

        <Link href={`/goals/${goal.id}`} className="flex-1 flex items-center gap-2 min-w-0">
          <Target size={16} className={priorityColors[goal.priority]} />
          <span className="text-sm truncate">{goal.title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColors[goal.status]}`}>
            {statusLabels[goal.status]}
          </span>
          {goal.progress > 0 && (
            <span className="text-xs text-gray-400 shrink-0">{goal.progress}%</span>
          )}
          {goal.due_date && (
            <span className="text-xs text-gray-400 shrink-0">{goal.due_date}</span>
          )}
        </Link>

        <button
          onClick={(e) => { e.stopPropagation(); onAddSubGoal(goal.id) }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
          title="サブゴール追加"
        >
          <Plus size={14} className="text-gray-500" />
        </button>
      </div>

      {expanded && hasChildren && (
        <div className="ml-5 border-l border-gray-200 pl-2">
          {goal.children.map((child) => (
            <GoalNode key={child.id} goal={child} onAddSubGoal={onAddSubGoal} />
          ))}
        </div>
      )}
    </div>
  )
}

export function GoalTree({
  goals,
  onAddSubGoal,
}: {
  goals: GoalWithChildren[]
  onAddSubGoal: (parentId: string) => void
}) {
  if (goals.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Target size={48} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">ゴールがまだありません</p>
        <p className="text-xs mt-1">「新規ゴール作成」からゴールを追加しましょう</p>
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {goals.map((goal) => (
        <GoalNode key={goal.id} goal={goal} onAddSubGoal={onAddSubGoal} />
      ))}
    </div>
  )
}
