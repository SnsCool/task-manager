'use client'

import { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import type { GoalWithChildren, GanttTimeScale, Goal } from '@/types'
import { calculateTimelineRange, getColumnWidth } from '@/lib/gantt-utils'
import { GanttTimeline } from './GanttTimeline'
import { GanttSidebar } from './GanttSidebar'
import { GanttGrid } from './GanttGrid'

interface GanttChartProps {
  goals: GoalWithChildren[]
  allGoals: Goal[]
  scale: GanttTimeScale
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onGoalClick: (goal: GoalWithChildren) => void
  onAddSubGoal: (parentId: string) => void
  onGoalUpdate?: (goalId: string, updates: { start_date?: string; due_date?: string }) => void
  onStatusChange?: (goalId: string, status: Goal['status']) => void
  onProgressChange?: (goalId: string, progress: number) => void
  onContextMenu?: (e: React.MouseEvent, goal: GoalWithChildren) => void
}

export function GanttChart({
  goals,
  allGoals,
  scale,
  expandedIds,
  onToggle,
  onGoalClick,
  onAddSubGoal,
  onGoalUpdate,
  onStatusChange,
  onProgressChange,
  onContextMenu,
}: GanttChartProps) {
  const sidebarScrollRef = useRef<HTMLDivElement>(null)
  const gridScrollRef = useRef<HTMLDivElement>(null)
  const isSyncing = useRef(false)
  const rowHeight = 40

  // Flatten tree based on expanded state
  const flatGoals = useMemo((): GoalWithChildren[] => {
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
  }, [goals, expandedIds])

  const range = calculateTimelineRange(allGoals, scale)
  const columnWidth = getColumnWidth(scale)

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
          onToggle={onToggle}
          onAddSubGoal={onAddSubGoal}
          onGoalClick={onGoalClick}
          onStatusChange={onStatusChange}
          onProgressChange={onProgressChange}
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
              onGoalUpdate={onGoalUpdate}
              onContextMenu={onContextMenu}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
