'use client'

import { useState, useRef, useEffect } from 'react'
import type { Goal } from '@/types'
import { getStatusColor, getStatusLabel } from '@/lib/gantt-utils'

const statuses: Goal['status'][] = ['not_started', 'in_progress', 'completed', 'on_hold']

interface StatusDropdownProps {
  status: Goal['status']
  onChange: (status: Goal['status']) => void
}

export function StatusDropdown({ status, onChange }: StatusDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className={`w-3 h-3 rounded-full shrink-0 ${getStatusColor(status)} hover:ring-2 hover:ring-offset-1 hover:ring-blue-300 transition-all`}
        title={getStatusLabel(status)}
      />
      {open && (
        <div className="absolute left-0 top-5 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-32">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={(e) => {
                e.stopPropagation()
                onChange(s)
                setOpen(false)
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 ${
                s === status ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(s)}`} />
              {getStatusLabel(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
