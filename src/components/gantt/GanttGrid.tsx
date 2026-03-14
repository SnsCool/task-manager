'use client'

import type { GoalWithChildren, GanttTimeScale, TimelineRange } from '@/types'
import { generateTimelineColumns, getColumnWidth } from '@/lib/gantt-utils'
import { GanttBar } from './GanttBar'

interface GanttGridProps {
  flatGoals: GoalWithChildren[]
  range: TimelineRange
  scale: GanttTimeScale
  rowHeight: number
  onGoalClick: (goal: GoalWithChildren) => void
  onGoalUpdate?: (goalId: string, updates: { start_date?: string; due_date?: string }) => void
  onContextMenu?: (e: React.MouseEvent, goal: GoalWithChildren) => void
}

export function GanttGrid({
  flatGoals,
  range,
  scale,
  rowHeight,
  onGoalClick,
  onGoalUpdate,
  onContextMenu,
}: GanttGridProps) {
  const columns = generateTimelineColumns(range, scale)
  const columnWidth = getColumnWidth(scale)
  const totalWidth = columns.length * columnWidth

  // Find today column index
  const todayIndex = columns.findIndex((c) => c.isToday)

  return (
    <div className="relative" style={{ width: totalWidth, minHeight: flatGoals.length * rowHeight }}>
      {/* Grid background */}
      <div className="absolute inset-0 flex">
        {columns.map((col, i) => (
          <div
            key={i}
            className={`shrink-0 border-r border-gray-100 ${
              col.isWeekend ? 'bg-gray-50' : ''
            }`}
            style={{ width: columnWidth, height: flatGoals.length * rowHeight }}
          />
        ))}
      </div>

      {/* Row separators */}
      {flatGoals.map((_, i) => (
        <div
          key={`row-${i}`}
          className="absolute w-full border-b border-gray-100"
          style={{ top: (i + 1) * rowHeight }}
        />
      ))}

      {/* Today marker */}
      {todayIndex >= 0 && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
          style={{ left: todayIndex * columnWidth + columnWidth / 2 }}
        />
      )}

      {/* Gantt bars */}
      {flatGoals.map((goal, i) => (
        <div
          key={goal.id}
          className="absolute w-full"
          style={{ top: i * rowHeight, height: rowHeight }}
        >
          <GanttBar
            goal={goal}
            range={range}
            columnWidth={columnWidth}
            rowHeight={rowHeight}
            onClick={onGoalClick}
            onGoalUpdate={onGoalUpdate}
            onContextMenu={onContextMenu}
          />
        </div>
      ))}
    </div>
  )
}
