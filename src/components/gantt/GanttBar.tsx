'use client'

import type { GoalWithChildren } from '@/types'
import type { TimelineRange } from '@/types'
import { calculateBarPosition, getStatusColor } from '@/lib/gantt-utils'

interface GanttBarProps {
  goal: GoalWithChildren
  range: TimelineRange
  columnWidth: number
  rowHeight: number
  onClick: (goal: GoalWithChildren) => void
}

export function GanttBar({ goal, range, columnWidth, rowHeight, onClick }: GanttBarProps) {
  const position = calculateBarPosition(goal, range, columnWidth)

  if (!position) return null

  const statusColor = getStatusColor(goal.status)
  const barHeight = 24
  const topOffset = (rowHeight - barHeight) / 2

  return (
    <div
      className={`absolute rounded-md cursor-pointer transition-opacity hover:opacity-80 ${statusColor}`}
      style={{
        left: position.left,
        width: position.width,
        top: topOffset,
        height: barHeight,
      }}
      onClick={() => onClick(goal)}
      title={`${goal.title} (${goal.progress}%)`}
    >
      {/* Progress indicator */}
      {goal.progress > 0 && (
        <div
          className="absolute inset-y-0 left-0 rounded-md bg-white/25"
          style={{ width: `${goal.progress}%` }}
        />
      )}
      {/* Label */}
      {position.width > 60 && (
        <span className="absolute inset-0 flex items-center px-2 text-[11px] text-white font-medium truncate">
          {goal.title}
        </span>
      )}
    </div>
  )
}
