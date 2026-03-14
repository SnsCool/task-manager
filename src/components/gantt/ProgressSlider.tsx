'use client'

import { useState, useCallback } from 'react'

interface ProgressSliderProps {
  progress: number
  onChange: (progress: number) => void
}

export function ProgressSlider({ progress, onChange }: ProgressSliderProps) {
  const [localValue, setLocalValue] = useState(progress)
  const [isDragging, setIsDragging] = useState(false)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setLocalValue(val)
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    if (localValue !== progress) {
      onChange(localValue)
    }
  }, [localValue, progress, onChange])

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  const displayValue = isDragging ? localValue : progress

  return (
    <div className="flex items-center gap-1.5 min-w-[80px]" onClick={(e) => e.stopPropagation()}>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={displayValue}
        onChange={handleChange}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        className="w-14 h-1 accent-blue-500 cursor-pointer"
      />
      <span className="text-[11px] text-gray-500 w-7 text-right tabular-nums">
        {displayValue}%
      </span>
    </div>
  )
}
