'use client'

import { ChevronRight, ChevronDown, Plus } from 'lucide-react'
import type { GoalWithChildren, Goal } from '@/types'
import { StatusDropdown } from './StatusDropdown'
import { ProgressSlider } from './ProgressSlider'

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

// Count all descendants recursively
function countDescendants(goal: GoalWithChildren): number {
  let count = goal.children.length
  goal.children.forEach((c) => { count += countDescendants(c) })
  return count
}

// Depth-based styling
function getDepthStyles(depth: number) {
  switch (depth) {
    case 0:
      return {
        fontSize: 'text-sm',
        fontWeight: 'font-semibold',
        textColor: 'text-gray-900',
        bgColor: 'bg-gray-50/80',
        rowBorder: 'border-b-2 border-gray-200',
        dotSize: 'w-3 h-3',
      }
    case 1:
      return {
        fontSize: 'text-[13px]',
        fontWeight: 'font-medium',
        textColor: 'text-gray-800',
        bgColor: '',
        rowBorder: 'border-b border-gray-100',
        dotSize: 'w-2.5 h-2.5',
      }
    default:
      return {
        fontSize: 'text-xs',
        fontWeight: 'font-normal',
        textColor: 'text-gray-600',
        bgColor: '',
        rowBorder: 'border-b border-gray-50',
        dotSize: 'w-2 h-2',
      }
  }
}

export function GanttSidebar({
  flatGoals,
  expandedIds,
  rowHeight,
  onToggle,
  onAddSubGoal,
  onGoalClick,
  onStatusChange,
  onProgressChange,
}: GanttSidebarProps) {
  return (
    <div className="w-[360px] shrink-0 border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="h-[52px] flex items-center text-sm font-semibold text-gray-700 border-b border-gray-100">
          <span className="flex-1 px-3">タスク名</span>
          <span className="w-[90px] text-center text-xs font-normal text-gray-500">進捗</span>
        </div>
      </div>

      {/* Task rows */}
      {flatGoals.map((goal, index) => {
        const hasChildren = goal.children && goal.children.length > 0
        const isExpanded = expandedIds.has(goal.id)
        const styles = getDepthStyles(goal.depth)
        const descendantCount = hasChildren ? countDescendants(goal) : 0

        // Determine if this is the last child at its level
        // (for drawing tree lines correctly)
        const isLastAtLevel = (() => {
          if (index === flatGoals.length - 1) return true
          const nextGoal = flatGoals[index + 1]
          if (!nextGoal) return true
          return nextGoal.depth <= goal.depth
        })()

        // Check if any subsequent sibling exists at same depth with same parent
        const hasNextSibling = (() => {
          for (let i = index + 1; i < flatGoals.length; i++) {
            const g = flatGoals[i]
            if (g.depth < goal.depth) return false
            if (g.depth === goal.depth && g.parent_id === goal.parent_id) return true
          }
          return false
        })()

        return (
          <div
            key={goal.id}
            className={`flex items-center hover:bg-blue-50/50 group relative ${styles.rowBorder} ${styles.bgColor}`}
            style={{ height: rowHeight }}
          >
            {/* Tree lines */}
            {goal.depth > 0 && (
              <>
                {/* Vertical line from parent */}
                <div
                  className="absolute border-l border-gray-300"
                  style={{
                    left: (goal.depth - 1) * 20 + 18,
                    top: 0,
                    height: hasNextSibling ? '100%' : '50%',
                  }}
                />
                {/* Horizontal branch line */}
                <div
                  className="absolute border-t border-gray-300"
                  style={{
                    left: (goal.depth - 1) * 20 + 18,
                    top: '50%',
                    width: 10,
                  }}
                />
              </>
            )}

            {/* Continuation lines for ancestor levels */}
            {Array.from({ length: goal.depth - 1 }, (_, lvl) => {
              // Check if there's a subsequent sibling at this ancestor level
              const ancestorDepth = lvl
              const hasAncestorSibling = (() => {
                for (let i = index + 1; i < flatGoals.length; i++) {
                  const g = flatGoals[i]
                  if (g.depth <= ancestorDepth) {
                    // Found something at ancestor level - check if it's a sibling
                    return g.depth === ancestorDepth + 1 || g.depth <= ancestorDepth
                  }
                }
                return false
              })()

              // Simplified: just check if any item after this has a parent chain at that level
              const showLine = (() => {
                for (let i = index + 1; i < flatGoals.length; i++) {
                  if (flatGoals[i].depth <= ancestorDepth) return flatGoals[i].depth === ancestorDepth + 1
                  if (flatGoals[i].depth > ancestorDepth) continue
                }
                return false
              })()

              return showLine ? (
                <div
                  key={`line-${lvl}`}
                  className="absolute border-l border-gray-200"
                  style={{
                    left: lvl * 20 + 18,
                    top: 0,
                    height: '100%',
                  }}
                />
              ) : null
            })}

            {/* Indent spacer */}
            <div style={{ width: goal.depth * 20 }} className="shrink-0" />

            {/* Expand/collapse toggle */}
            <button
              onClick={() => hasChildren && onToggle(goal.id)}
              className={`w-5 h-5 flex items-center justify-center shrink-0 rounded transition-colors ${
                hasChildren
                  ? 'text-gray-500 hover:text-blue-600 hover:bg-blue-100'
                  : 'invisible'
              }`}
            >
              {hasChildren && (
                isExpanded
                  ? <ChevronDown size={goal.depth === 0 ? 16 : 14} />
                  : <ChevronRight size={goal.depth === 0 ? 16 : 14} />
              )}
            </button>

            {/* Status dropdown */}
            <div className="shrink-0 mx-1.5">
              <StatusDropdown
                status={goal.status}
                onChange={(status) => onStatusChange?.(goal.id, status)}
              />
            </div>

            {/* Title + children count */}
            <button
              onClick={() => onGoalClick(goal)}
              className={`flex-1 text-left truncate px-1 hover:text-blue-600 min-w-0 flex items-center gap-1.5 ${styles.fontSize} ${styles.fontWeight} ${styles.textColor}`}
            >
              <span className="truncate">{goal.title}</span>
              {hasChildren && (
                <span className="shrink-0 text-[10px] font-normal text-gray-400 bg-gray-100 rounded-full px-1.5 py-0.5 leading-none">
                  {descendantCount}
                </span>
              )}
            </button>

            {/* Progress slider */}
            <div className="shrink-0 mr-1">
              <ProgressSlider
                progress={goal.progress}
                onChange={(progress) => onProgressChange?.(goal.id, progress)}
              />
            </div>

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
