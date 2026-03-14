'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import type { GoalWithChildren } from '@/types'
import type { TimelineRange } from '@/types'
import {
  calculateBarPosition,
  getStatusColor,
  getStatusLabel,
  getPriorityLabel,
  formatDate,
  pixelOffsetToDays,
  addDaysToDateString,
} from '@/lib/gantt-utils'

type DragMode = 'move' | 'resize-left' | 'resize-right' | null

interface GanttBarProps {
  goal: GoalWithChildren
  range: TimelineRange
  columnWidth: number
  rowHeight: number
  onClick: (goal: GoalWithChildren) => void
  onGoalUpdate?: (goalId: string, updates: { start_date?: string; due_date?: string }) => void
  onContextMenu?: (e: React.MouseEvent, goal: GoalWithChildren) => void
}

export function GanttBar({
  goal,
  range,
  columnWidth,
  rowHeight,
  onClick,
  onGoalUpdate,
  onContextMenu,
}: GanttBarProps) {
  const position = calculateBarPosition(goal, range, columnWidth)
  const barRef = useRef<HTMLDivElement>(null)

  // Drag state
  const [dragMode, setDragMode] = useState<DragMode>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const dragStartX = useRef(0)
  const originalPosition = useRef<{ left: number; width: number } | null>(null)

  // Tooltip state
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  if (!position) return null

  const statusColor = getStatusColor(goal.status)
  const barHeight = 24
  const topOffset = (rowHeight - barHeight) / 2
  const handleWidth = 6

  // Calculate visual position during drag
  let displayLeft = position.left
  let displayWidth = position.width

  if (dragMode === 'move') {
    displayLeft = position.left + dragOffset
    displayWidth = position.width
  } else if (dragMode === 'resize-right') {
    displayWidth = Math.max(columnWidth, position.width + dragOffset)
  } else if (dragMode === 'resize-left') {
    displayLeft = position.left + dragOffset
    displayWidth = Math.max(columnWidth, position.width - dragOffset)
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, mode: DragMode) => {
      e.preventDefault()
      e.stopPropagation()
      setDragMode(mode)
      setDragOffset(0)
      dragStartX.current = e.clientX
      originalPosition.current = { left: position.left, width: position.width }
      setShowTooltip(false)
    },
    [position]
  )

  useEffect(() => {
    if (!dragMode) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartX.current
      // Snap to day grid
      const snappedDx = Math.round(dx / columnWidth) * columnWidth
      setDragOffset(snappedDx)
    }

    const handleMouseUp = () => {
      if (dragMode && dragOffset !== 0 && onGoalUpdate) {
        const daysDelta = pixelOffsetToDays(dragOffset, columnWidth)

        if (dragMode === 'move') {
          const updates: { start_date?: string; due_date?: string } = {}
          if (goal.start_date) updates.start_date = addDaysToDateString(goal.start_date, daysDelta)
          if (goal.due_date) updates.due_date = addDaysToDateString(goal.due_date, daysDelta)
          onGoalUpdate(goal.id, updates)
        } else if (dragMode === 'resize-right') {
          if (goal.due_date) {
            onGoalUpdate(goal.id, { due_date: addDaysToDateString(goal.due_date, daysDelta) })
          }
        } else if (dragMode === 'resize-left') {
          if (goal.start_date) {
            onGoalUpdate(goal.id, { start_date: addDaysToDateString(goal.start_date, daysDelta) })
          }
        }
      }
      setDragMode(null)
      setDragOffset(0)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragMode, dragOffset, columnWidth, goal, onGoalUpdate])

  const handleBarClick = useCallback(
    (e: React.MouseEvent) => {
      if (dragMode) return
      onClick(goal)
    },
    [dragMode, onClick, goal]
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onContextMenu?.(e, goal)
    },
    [onContextMenu, goal]
  )

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (dragMode) return
    setTooltipPos({ x: e.clientX, y: e.clientY })
    setShowTooltip(true)
  }, [dragMode])

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false)
  }, [])

  const priorityColors: Record<string, string> = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-green-600',
  }

  return (
    <>
      <div
        ref={barRef}
        className={`absolute rounded-md transition-opacity ${
          dragMode ? 'opacity-70 z-30' : 'hover:opacity-90'
        } ${statusColor}`}
        style={{
          left: displayLeft,
          width: displayWidth,
          top: topOffset,
          height: barHeight,
          cursor: dragMode === 'move' ? 'grabbing' : 'grab',
        }}
        onClick={handleBarClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Left resize handle */}
        <div
          className="absolute left-0 top-0 bottom-0 cursor-col-resize z-10 hover:bg-white/30 rounded-l-md"
          style={{ width: handleWidth }}
          onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
        />

        {/* Center drag area */}
        <div
          className="absolute top-0 bottom-0"
          style={{ left: handleWidth, right: handleWidth, cursor: dragMode === 'move' ? 'grabbing' : 'grab' }}
          onMouseDown={(e) => handleMouseDown(e, 'move')}
        />

        {/* Right resize handle */}
        <div
          className="absolute right-0 top-0 bottom-0 cursor-col-resize z-10 hover:bg-white/30 rounded-r-md"
          style={{ width: handleWidth }}
          onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
        />

        {/* Progress indicator */}
        {goal.progress > 0 && (
          <div
            className="absolute inset-y-0 left-0 rounded-md bg-white/25 pointer-events-none"
            style={{ width: `${goal.progress}%` }}
          />
        )}

        {/* Label */}
        {displayWidth > 60 && (
          <span className="absolute inset-0 flex items-center px-2 text-[11px] text-white font-medium truncate pointer-events-none">
            {goal.title}
          </span>
        )}
      </div>

      {/* Rich Tooltip */}
      {showTooltip && !dragMode && (
        <div
          className="fixed z-[200] bg-gray-800 text-white rounded-lg shadow-xl px-3 py-2 text-xs pointer-events-none"
          style={{
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 60,
          }}
        >
          <div className="font-semibold mb-1 max-w-[200px] truncate">{goal.title}</div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(goal.status)}`} />
            <span>{getStatusLabel(goal.status)}</span>
            <span className="text-gray-400">|</span>
            <span className={priorityColors[goal.priority] || 'text-gray-300'}>
              {getPriorityLabel(goal.priority)}
            </span>
          </div>
          <div className="text-gray-300">
            {formatDate(goal.start_date)} ~ {formatDate(goal.due_date)}
          </div>
          <div className="text-gray-300">
            進捗: {goal.progress}%
          </div>
        </div>
      )}
    </>
  )
}
