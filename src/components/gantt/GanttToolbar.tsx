'use client'

import { ChevronDown, ChevronUp, ChevronsDownUp, ChevronsUpDown, ArrowUpDown } from 'lucide-react'
import type { Goal } from '@/types'
import { getStatusColor, getStatusLabel } from '@/lib/gantt-utils'

export type SortKey = 'created_at' | 'due_date' | 'priority' | 'status'
export type StatusFilter = Goal['status']
export type PriorityFilter = Goal['priority']

interface GanttToolbarProps {
  statusFilters: Set<StatusFilter>
  priorityFilters: Set<PriorityFilter>
  sortKey: SortKey
  onToggleStatus: (s: StatusFilter) => void
  onTogglePriority: (p: PriorityFilter) => void
  onSortChange: (k: SortKey) => void
  onExpandAll: () => void
  onCollapseAll: () => void
}

const statusOptions: StatusFilter[] = ['not_started', 'in_progress', 'completed', 'on_hold']
const priorityOptions: { value: PriorityFilter; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]
const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'created_at', label: '作成順' },
  { value: 'due_date', label: '日付順' },
  { value: 'priority', label: '優先度順' },
  { value: 'status', label: 'ステータス順' },
]

export function GanttToolbar({
  statusFilters,
  priorityFilters,
  sortKey,
  onToggleStatus,
  onTogglePriority,
  onSortChange,
  onExpandAll,
  onCollapseAll,
}: GanttToolbarProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Status filter chips */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 mr-1">ステータス:</span>
        {statusOptions.map((s) => {
          const active = statusFilters.has(s)
          return (
            <button
              key={s}
              onClick={() => onToggleStatus(s)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${getStatusColor(s)}`} />
              {getStatusLabel(s)}
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-gray-200" />

      {/* Priority filter chips */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 mr-1">優先度:</span>
        {priorityOptions.map((p) => {
          const active = priorityFilters.has(p.value)
          return (
            <button
              key={p.value}
              onClick={() => onTogglePriority(p.value)}
              className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-gray-200" />

      {/* Sort select */}
      <div className="flex items-center gap-1">
        <ArrowUpDown size={12} className="text-gray-400" />
        <select
          value={sortKey}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="text-xs text-gray-600 bg-transparent border-none outline-none cursor-pointer py-0.5"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-gray-200" />

      {/* Expand/Collapse */}
      <div className="flex items-center gap-1">
        <button
          onClick={onExpandAll}
          className="flex items-center gap-1 px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          title="全展開"
        >
          <ChevronsUpDown size={13} />
          展開
        </button>
        <button
          onClick={onCollapseAll}
          className="flex items-center gap-1 px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          title="全折りたたみ"
        >
          <ChevronsDownUp size={13} />
          折畳
        </button>
      </div>
    </div>
  )
}
