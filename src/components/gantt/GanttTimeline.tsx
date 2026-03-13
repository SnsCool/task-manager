'use client'

import type { GanttTimeScale, TimelineRange } from '@/types'
import { generateTimelineColumns, getColumnWidth } from '@/lib/gantt-utils'

interface GanttTimelineProps {
  range: TimelineRange
  scale: GanttTimeScale
}

export function GanttTimeline({ range, scale }: GanttTimelineProps) {
  const columns = generateTimelineColumns(range, scale)
  const columnWidth = getColumnWidth(scale)

  // Group columns by month for the top header row
  const months: { label: string; span: number }[] = []
  let currentMonth = ''
  columns.forEach((col) => {
    const monthKey = `${col.date.getFullYear()}/${col.date.getMonth() + 1}`
    if (monthKey !== currentMonth) {
      months.push({ label: `${col.date.getFullYear()}年${col.date.getMonth() + 1}月`, span: 1 })
      currentMonth = monthKey
    } else {
      months[months.length - 1].span++
    }
  })

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
      {/* Month row */}
      <div className="flex border-b border-gray-100">
        {months.map((m, i) => (
          <div
            key={i}
            className="text-[11px] text-gray-500 font-medium px-1 truncate border-r border-gray-100 flex items-center"
            style={{ width: m.span * columnWidth, height: 24 }}
          >
            {m.label}
          </div>
        ))}
      </div>
      {/* Day/date row */}
      <div className="flex">
        {columns.map((col, i) => (
          <div
            key={i}
            className={`shrink-0 flex items-center justify-center text-[10px] border-r border-gray-100 ${
              col.isToday
                ? 'bg-red-50 text-red-600 font-bold'
                : col.isWeekend
                ? 'bg-gray-50 text-gray-400'
                : 'text-gray-500'
            }`}
            style={{ width: columnWidth, height: 28 }}
          >
            {col.label}
          </div>
        ))}
      </div>
    </div>
  )
}
