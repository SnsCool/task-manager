'use client'

import { File, Plus } from 'lucide-react'
import type { GoalWithChildren, Goal } from '@/types'
import { formatDate } from '@/lib/gantt-utils'

interface GanttSidebarProps {
  flatGoals: GoalWithChildren[]
  expandedIds: Set<string>
  rowHeight: number
  onToggle: (id: string) => void
  onAddSubGoal: (parentId: string) => void
  onGoalClick: (goal: GoalWithChildren) => void
  onStatusChange?: (goalId: string, status: Goal['status']) => void
  onProgressChange?: (goalId: string, progress: number) => void
}

// Build display rows: task rows + "新規サブアイテム" rows
type DisplayRow =
  | { type: 'goal'; goal: GoalWithChildren }
  | { type: 'add'; parentId: string; depth: number }

function buildDisplayRows(
  flatGoals: GoalWithChildren[],
  expandedIds: Set<string>
): DisplayRow[] {
  const rows: DisplayRow[] = []

  for (let i = 0; i < flatGoals.length; i++) {
    const goal = flatGoals[i]
    rows.push({ type: 'goal', goal })

    // After the last child of an expanded parent, insert "add" row
    const hasChildren = goal.children && goal.children.length > 0
    const isExpanded = expandedIds.has(goal.id)

    if (hasChildren && isExpanded) {
      // Find where this group ends
      let lastChildIdx = i
      for (let j = i + 1; j < flatGoals.length; j++) {
        if (flatGoals[j].depth > goal.depth) {
          lastChildIdx = j
        } else {
          break
        }
      }
      // The "add" row goes after all descendants - we'll insert it
      // when we encounter the transition
    }

    // Check if next item exits this group → insert add row for the parent
    const nextGoal = flatGoals[i + 1]
    if (nextGoal && nextGoal.depth < goal.depth) {
      // We're leaving one or more parent groups
      // Insert "add" rows for each parent that is closing
      for (let d = goal.depth; d > nextGoal.depth; d--) {
        // Find the parent at depth d-1
        const parent = findParentAtDepth(flatGoals, i, d - 1)
        if (parent && expandedIds.has(parent.id)) {
          rows.push({ type: 'add', parentId: parent.id, depth: d })
        }
      }
    } else if (!nextGoal) {
      // End of list - close all open parents
      for (let d = goal.depth; d > 0; d--) {
        const parent = findParentAtDepth(flatGoals, i, d - 1)
        if (parent && expandedIds.has(parent.id)) {
          rows.push({ type: 'add', parentId: parent.id, depth: d })
        }
      }
      // Also add for root level expanded items
      // Check if the last top-level expanded goal needs an add row
    }
  }

  // Add "add" rows at root level after the last root-level group
  // (This handles the case for root-level expanded items)

  return rows
}

function findParentAtDepth(
  flatGoals: GoalWithChildren[],
  fromIndex: number,
  targetDepth: number
): GoalWithChildren | null {
  for (let i = fromIndex; i >= 0; i--) {
    if (flatGoals[i].depth === targetDepth) return flatGoals[i]
  }
  return null
}

export function GanttSidebar({
  flatGoals,
  expandedIds,
  rowHeight,
  onToggle,
  onAddSubGoal,
  onGoalClick,
}: GanttSidebarProps) {
  const displayRows = buildDisplayRows(flatGoals, expandedIds)

  return (
    <div className="w-[380px] shrink-0 border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="h-[52px] flex items-center text-sm text-gray-500 border-b border-gray-100">
          <div className="flex items-center gap-1.5 flex-1 px-4">
            <span className="text-xs font-medium tracking-wide text-gray-400">Aa</span>
            <span className="font-medium text-gray-600">タスク名</span>
          </div>
          <div className="w-[80px] shrink-0 text-center text-xs text-gray-400">
            期日
          </div>
        </div>
      </div>

      {/* Rows */}
      {displayRows.map((row, i) => {
        if (row.type === 'add') {
          return (
            <div
              key={`add-${row.parentId}-${i}`}
              className="flex items-center border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              style={{ height: rowHeight - 4 }}
              onClick={() => onAddSubGoal(row.parentId)}
            >
              <div style={{ width: row.depth * 28 + 12 }} className="shrink-0" />
              <Plus size={13} className="text-gray-400 mr-1.5" />
              <span className="text-sm text-gray-400">新規サブアイテム</span>
            </div>
          )
        }

        const goal = row.goal
        const hasChildren = goal.children && goal.children.length > 0
        const isExpanded = expandedIds.has(goal.id)
        const isTopLevel = goal.depth === 0

        return (
          <div
            key={goal.id}
            className={`flex items-center hover:bg-gray-50/80 group cursor-default ${
              isTopLevel ? 'border-b border-gray-200' : 'border-b border-gray-100'
            }`}
            style={{ height: rowHeight }}
          >
            {/* Indent */}
            <div style={{ width: goal.depth * 28 + 12 }} className="shrink-0" />

            {/* Toggle triangle */}
            <button
              onClick={() => hasChildren && onToggle(goal.id)}
              className={`w-5 h-5 flex items-center justify-center shrink-0 ${
                hasChildren ? 'text-gray-500 hover:text-gray-700' : 'text-transparent pointer-events-none'
              }`}
            >
              {hasChildren ? (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="currentColor"
                  className={`transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
                >
                  <path d="M2.5 1L8 5L2.5 9V1Z" />
                </svg>
              ) : (
                <span className="w-2.5" />
              )}
            </button>

            {/* Document icon */}
            <File size={16} className="shrink-0 mx-1.5 text-gray-400" strokeWidth={1.5} />

            {/* Title */}
            <button
              onClick={() => onGoalClick(goal)}
              className={`flex-1 text-left truncate hover:text-blue-600 min-w-0 ${
                isTopLevel
                  ? 'text-[14px] font-medium text-gray-900'
                  : 'text-[13px] text-gray-700'
              }`}
            >
              {goal.title}
            </button>

            {/* Due date */}
            <div className="w-[80px] shrink-0 text-center text-xs text-gray-400 tabular-nums">
              {goal.due_date ? formatShortDate(goal.due_date) : ''}
            </div>
          </div>
        )
      })}

      {/* Root-level "新規サブアイテム" at bottom */}
      <div
        className="flex items-center border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
        style={{ height: rowHeight - 4 }}
        onClick={() => onAddSubGoal('')}
      >
        <div style={{ width: 12 }} className="shrink-0" />
        <Plus size={13} className="text-gray-400 mr-1.5" />
        <span className="text-sm text-gray-400">新規サブアイテム</span>
      </div>
    </div>
  )
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}
