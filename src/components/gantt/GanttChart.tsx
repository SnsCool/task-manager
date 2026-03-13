'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import type { GoalWithChildren, GanttTimeScale, Goal } from '@/types'
import { calculateTimelineRange, getColumnWidth } from '@/lib/gantt-utils'
import { GanttTimeline } from './GanttTimeline'
import { GanttSidebar } from './GanttSidebar'
import { GanttGrid } from './GanttGrid'

interface GanttChartProps {
  goals: GoalWithChildren[]
  allGoals: Goal[]
  scale: GanttTimeScale
  onGoalClick: (goal: GoalWithChildren) => void
  onAddSubGoal: (parentId: string) => void
}

export function GanttChart({ goals, allGoals, scale, onGoalClick, onAddSubGoal }: GanttChartProps) {
  const sidebarScrollRef = useRef<HTMLDivElement>(null)
  const gridScrollRef = useRef<HTMLDivElement>(null)
  const isSyncing = useRef(false)
  const rowHeight = 40

  // Track expanded goal IDs
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Initially expand all goals that have children
    const ids = new Set<string>()
    const collectExpandable = (nodes: GoalWithChildren[]) => {
      nodes.forEach((n) => {
        if (n.children.length > 0) {
          ids.add(n.id)
          collectExpandable(n.children)
        }
      })
    }
    collectExpandable(goals)
    return ids
  })

  // Rebuild expanded set when goals change
  useEffect(() => {
    setExpandedIds((prev) => {
      const ids = new Set(prev)
      const collectExpandable = (nodes: GoalWithChildren[]) => {
        nodes.forEach((n) => {
          if (n.children.length > 0 && !ids.has(n.id)) {
            ids.add(n.id)
          }
          collectExpandable(n.children)
        })
      }
      collectExpandable(goals)
      return ids
    })
  }, [goals])

  // Flatten tree based on expanded state
  const flatGoals = useCallback((): GoalWithChildren[] => {
    const result: GoalWithChildren[] = []
    const flatten = (nodes: GoalWithChildren[]) => {
      nodes.forEach((node) => {
        result.push(node)
        if (expandedIds.has(node.id) && node.children.length > 0) {
          flatten(node.children)
        }
      })
    }
    flatten(goals)
    return result
  }, [goals, expandedIds])()

  const range = calculateTimelineRange(allGoals, scale)
  const columnWidth = getColumnWidth(scale)

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Synchronized vertical scrolling
  const handleSidebarScroll = useCallback(() => {
    if (isSyncing.current) return
    isSyncing.current = true
    if (gridScrollRef.current && sidebarScrollRef.current) {
      gridScrollRef.current.scrollTop = sidebarScrollRef.current.scrollTop
    }
    isSyncing.current = false
  }, [])

  const handleGridScroll = useCallback(() => {
    if (isSyncing.current) return
    isSyncing.current = true
    if (sidebarScrollRef.current && gridScrollRef.current) {
      sidebarScrollRef.current.scrollTop = gridScrollRef.current.scrollTop
    }
    isSyncing.current = false
  }, [])

  return (
    <div className="flex h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Left: Sidebar */}
      <div
        ref={sidebarScrollRef}
        onScroll={handleSidebarScroll}
        className="overflow-y-auto overflow-x-hidden"
        style={{ maxHeight: '100%' }}
      >
        <GanttSidebar
          flatGoals={flatGoals}
          expandedIds={expandedIds}
          rowHeight={rowHeight}
          onToggle={handleToggle}
          onAddSubGoal={onAddSubGoal}
          onGoalClick={onGoalClick}
        />
      </div>

      {/* Right: Timeline + Grid */}
      <div className="flex-1 overflow-hidden flex flex-col min-w-0">
        <div
          ref={gridScrollRef}
          onScroll={handleGridScroll}
          className="overflow-auto flex-1"
        >
          <div style={{ minWidth: range.totalDays * columnWidth }}>
            <GanttTimeline range={range} scale={scale} />
            <GanttGrid
              flatGoals={flatGoals}
              range={range}
              scale={scale}
              rowHeight={rowHeight}
              onGoalClick={onGoalClick}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
