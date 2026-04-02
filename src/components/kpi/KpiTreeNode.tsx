'use client'

import { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Target,
  BarChart3,
  AlertTriangle,
  CheckSquare,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import type { KpiTreeNode as KpiTreeNodeType, GoalType } from '@/types'

const goalTypeConfig: Record<
  GoalType,
  { label: string; icon: typeof Target; color: string; bgColor: string }
> = {
  kgi: {
    label: 'KGI',
    icon: Target,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
  },
  kpi: {
    label: 'KPI',
    icon: BarChart3,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  issue: {
    label: '課題',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
  },
  task: {
    label: 'タスク',
    icon: CheckSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
  },
}

const statusColors: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
}

const statusLabels: Record<string, string> = {
  not_started: '未着手',
  in_progress: '進行中',
  completed: '完了',
  on_hold: '保留',
}

function MetricDisplay({
  current,
  target,
  unit,
}: {
  current: number | null
  target: number | null
  unit: string | null
}) {
  if (target == null) return null
  const currentVal = current ?? 0
  const percentage = target > 0 ? Math.min((currentVal / target) * 100, 100) : 0
  const isAchieved = currentVal >= target

  return (
    <div className="flex items-center gap-2 ml-2">
      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isAchieved ? 'bg-green-500' : percentage > 60 ? 'bg-blue-500' : 'bg-red-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${isAchieved ? 'text-green-600' : 'text-gray-500'}`}>
        {currentVal}{unit || ''} / {target}{unit || ''}
      </span>
    </div>
  )
}

export function KpiTreeNodeComponent({
  node,
  onAddChild,
  defaultExpanded = true,
}: {
  node: KpiTreeNodeType
  onAddChild: (parentId: string, parentType: GoalType) => void
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const goalType = (node.goalType || node.goal_type || 'task') as GoalType
  const config = goalTypeConfig[goalType]
  const Icon = config.icon
  const hasChildren = node.children && node.children.length > 0
  const canAddChild = goalType !== 'task'

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg border transition-colors hover:shadow-sm group ${config.bgColor}`}
      >
        {/* Expand/Collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-5 h-5 flex items-center justify-center shrink-0"
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown size={16} className="text-gray-500" />
            ) : (
              <ChevronRight size={16} className="text-gray-500" />
            )
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          )}
        </button>

        {/* Type Badge */}
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${config.color} bg-white border`}
        >
          {config.label}
        </span>

        {/* Icon */}
        <Icon size={16} className={config.color} />

        {/* Title & Link */}
        <Link
          href={`/goals/${node.id}`}
          className="flex-1 min-w-0 text-sm font-medium text-gray-800 truncate hover:text-blue-600"
        >
          {node.title}
        </Link>

        {/* Metric Display (KGI/KPI only) */}
        {(goalType === 'kgi' || goalType === 'kpi') && (
          <MetricDisplay
            current={node.metricCurrent ?? node.metric_current}
            target={node.metricTarget ?? node.metric_target}
            unit={node.metricUnit ?? node.metric_unit}
          />
        )}

        {/* Status Badge */}
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${statusColors[node.status]}`}
        >
          {statusLabels[node.status]}
        </span>

        {/* Progress */}
        {node.progress > 0 && (
          <span className="text-xs text-gray-400 shrink-0">{node.progress}%</span>
        )}

        {/* Assignees */}
        {node.assignees && node.assignees.length > 0 && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Users size={12} className="text-gray-400" />
            <span className="text-xs text-gray-400">{node.assignees.length}</span>
          </div>
        )}

        {/* Add child button */}
        {canAddChild && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddChild(node.id, goalType)
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/70 rounded transition-opacity"
            title={`${goalTypeConfig[goalType === 'kgi' ? 'kpi' : goalType === 'kpi' ? 'issue' : 'task'].label}を追加`}
          >
            <Plus size={14} className="text-gray-500" />
          </button>
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
          {node.children.map((child) => (
            <KpiTreeNodeComponent
              key={child.id}
              node={child}
              onAddChild={onAddChild}
              defaultExpanded={child.depth < 2}
            />
          ))}
        </div>
      )}
    </div>
  )
}
