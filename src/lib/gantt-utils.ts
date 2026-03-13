import type { Goal, GanttTimeScale, TimelineRange } from '@/types'

const DAY_MS = 86400000

/**
 * Calculate the timeline range from goals
 */
export function calculateTimelineRange(
  goals: Goal[],
  scale: GanttTimeScale,
  padding: number = 7
): TimelineRange {
  let minDate = new Date()
  let maxDate = new Date()

  const datesExist = goals.some((g) => g.start_date || g.due_date)

  if (datesExist) {
    const dates: Date[] = []
    goals.forEach((g) => {
      if (g.start_date) dates.push(new Date(g.start_date))
      if (g.due_date) dates.push(new Date(g.due_date))
    })
    if (dates.length > 0) {
      minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
      maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))
    }
  }

  // Add padding
  minDate = new Date(minDate.getTime() - padding * DAY_MS)
  maxDate = new Date(maxDate.getTime() + padding * DAY_MS)

  // Snap to boundaries based on scale
  if (scale === 'week') {
    const dayOfWeek = minDate.getDay()
    minDate = new Date(minDate.getTime() - dayOfWeek * DAY_MS)
    const endDayOfWeek = maxDate.getDay()
    if (endDayOfWeek !== 6) {
      maxDate = new Date(maxDate.getTime() + (6 - endDayOfWeek) * DAY_MS)
    }
  } else if (scale === 'month') {
    minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0)
  }

  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / DAY_MS) + 1

  return { start: minDate, end: maxDate, totalDays }
}

/**
 * Calculate bar position for a goal in the timeline
 */
export function calculateBarPosition(
  goal: Goal,
  range: TimelineRange,
  columnWidth: number
): { left: number; width: number } | null {
  const start = goal.start_date ? new Date(goal.start_date) : null
  const end = goal.due_date ? new Date(goal.due_date) : null

  if (!start && !end) return null

  const barStart = start || end!
  const barEnd = end || start!

  const startOffset = Math.max(
    0,
    Math.floor((barStart.getTime() - range.start.getTime()) / DAY_MS)
  )
  const endOffset = Math.min(
    range.totalDays - 1,
    Math.floor((barEnd.getTime() - range.start.getTime()) / DAY_MS)
  )

  const left = startOffset * columnWidth
  const width = Math.max((endOffset - startOffset + 1) * columnWidth, columnWidth)

  return { left, width }
}

/**
 * Generate column dates for the timeline header
 */
export function generateTimelineColumns(
  range: TimelineRange,
  scale: GanttTimeScale
): { date: Date; label: string; isWeekend: boolean; isToday: boolean; isMonthStart: boolean }[] {
  const columns: {
    date: Date
    label: string
    isWeekend: boolean
    isToday: boolean
    isMonthStart: boolean
  }[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const current = new Date(range.start)

  while (current <= range.end) {
    const dayOfWeek = current.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isToday =
      current.getFullYear() === today.getFullYear() &&
      current.getMonth() === today.getMonth() &&
      current.getDate() === today.getDate()
    const isMonthStart = current.getDate() === 1

    let label = ''
    if (scale === 'day') {
      label = `${current.getMonth() + 1}/${current.getDate()}`
    } else if (scale === 'week') {
      if (dayOfWeek === 1 || columns.length === 0) {
        label = `${current.getMonth() + 1}/${current.getDate()}`
      }
    } else {
      if (isMonthStart || columns.length === 0) {
        label = `${current.getFullYear()}/${current.getMonth() + 1}`
      }
    }

    columns.push({ date: new Date(current), label, isWeekend, isToday, isMonthStart })
    current.setDate(current.getDate() + 1)
  }

  return columns
}

/**
 * Get column width based on scale
 */
export function getColumnWidth(scale: GanttTimeScale): number {
  switch (scale) {
    case 'day':
      return 40
    case 'week':
      return 20
    case 'month':
      return 8
  }
}

/**
 * Get status color for Gantt bar
 */
export function getStatusColor(status: Goal['status']): string {
  switch (status) {
    case 'not_started':
      return 'bg-gray-400'
    case 'in_progress':
      return 'bg-blue-500'
    case 'completed':
      return 'bg-green-500'
    case 'on_hold':
      return 'bg-yellow-500'
    default:
      return 'bg-gray-400'
  }
}

/**
 * Get status label in Japanese
 */
export function getStatusLabel(status: Goal['status']): string {
  switch (status) {
    case 'not_started':
      return '未着手'
    case 'in_progress':
      return '進行中'
    case 'completed':
      return '完了'
    case 'on_hold':
      return '保留'
    default:
      return status
  }
}

/**
 * Format date for display
 */
export function formatDate(date: string | null): string {
  if (!date) return '-'
  const d = new Date(date)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}
