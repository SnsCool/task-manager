'use client'

import { useEffect, useRef } from 'react'
import { Edit3, Trash2, Plus } from 'lucide-react'

interface ContextMenuProps {
  x: number
  y: number
  onEdit: () => void
  onDelete: () => void
  onAddSubTask: () => void
  onClose: () => void
}

export function ContextMenu({ x, y, onEdit, onDelete, onAddSubTask, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Adjust position to stay within viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 100,
  }

  return (
    <div ref={ref} style={style} className="bg-white border border-gray-200 rounded-lg shadow-xl py-1 w-48">
      <button
        onClick={() => { onEdit(); onClose() }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        <Edit3 size={14} className="text-gray-400" />
        編集
      </button>
      <button
        onClick={() => { onAddSubTask(); onClose() }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        <Plus size={14} className="text-gray-400" />
        サブタスク追加
      </button>
      <div className="border-t border-gray-100 my-1" />
      <button
        onClick={() => { onDelete(); onClose() }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
      >
        <Trash2 size={14} className="text-red-400" />
        削除
      </button>
    </div>
  )
}
