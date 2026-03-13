'use client'

import { ChevronRight, ChevronDown, Plus } from 'lucide-react'
import type { GoalWithChildren } from '@/types'
import { getStatusColor } from '@/lib/gantt-utils'

interface GanttSidebarProps {
  flatGoals: GoalWithChildren[]
  expandedIds: Set<string>
  rowHeight: number
  onToggle: (id: string) => void
  onAddSubGoal: (parentId: string) => void
  onGoalClick: (goal: GoalWithChildren) => void
}

export function GanttSidebar({
  flatGoals,
  expandedIds,
  rowHeight,
  onToggle,
  onAddSubGoal,
  onGoalClick,
}: GanttSidebarProps) {
  return (
    <div className="w-[300px] shrink-0 border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="h-[52px] flex items-center px-3 text-sm font-semibold text-gray-700 border-b border-gray-100">
          タスク名
        </div>
      </div>

      {/* Task rows */}
      {flatGoals.map((goal) => {
        const hasChildren = goal.children && goal.children.length > 0
        const isExpanded = expandedIds.has(goal.id)
        const statusDotColor = getStatusColor(goal.status).replace('bg-', 'bg-')

        return (
          <div
            key={goal.id}
            className="flex items-center border-b border-gray-100 hover:bg-blue-50/50 group"
            style={{ height: rowHeight }}
          >
            {/* Indent */}
            <div style={{ width: goal.depth * 20 }} className="shrink-0" />

            {/* Expand/collapse */}
            <button
              onClick={() => hasChildren && onToggle(goal.id)}
              className={`w-5 h-5 flex items-center justify-center shrink-0 ${
                hasChildren ? 'text-gray-400 hover:text-gray-600' : 'invisible'
              }`}
            >
              {hasChildren && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
            </button>

            {/* Status dot */}
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 mx-1.5 ${statusDotColor}`} />

            {/* Title */}
            <button
              onClick={() => onGoalClick(goal)}
              className="flex-1 text-left text-sm text-gray-800 truncate px-1 hover:text-blue-600"
            >
              {goal.title}
            </button>

            {/* Add sub-goal */}
            <button
              onClick={() => onAddSubGoal(goal.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-500 shrink-0 mr-2"
              title="サブタスク追加"
            >
              <Plus size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
