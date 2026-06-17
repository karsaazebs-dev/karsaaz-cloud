import { useEffect, useState } from 'react'

const COLORS = ['#2B7FFF', '#a78bfa', '#34d399']

interface StorageSegment {
  label: string
  gb: number
  color: string
}

export default function StorageWidget(): JSX.Element {
  const [used, setUsed] = useState(200)
  const total = 500

  const segments: StorageSegment[] = [
    { label: 'Documents', gb: 80, color: COLORS[0] },
    { label: 'Media', gb: 70, color: COLORS[1] },
    { label: 'Other', gb: 50, color: COLORS[2] },
  ]

  const usedPct = Math.min((used / total) * 100, 100)

  return (
    <div className="mx-3 mb-4 rounded-[14px] border border-[#e5e7eb] bg-[#f8fafc] p-4">
      <p className="font-display text-[13px] font-semibold text-[#101010]">Storage</p>
      <p className="mt-0.5 font-display text-[12px] font-medium text-[#6b7280]">
        {used} GB of {total} GB used
      </p>

      {/* Segmented bar */}
      <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-[#e5e7eb]">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="h-full"
            style={{ width: `${(seg.gb / total) * 100}%`, background: seg.color }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-col gap-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
              <span className="font-display text-[12px] font-medium text-[#6b7280]">{seg.label}</span>
            </div>
            <span className="font-display text-[12px] font-semibold text-[#101010]">{seg.gb} GB</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button className="flex h-8 flex-1 items-center justify-center rounded-[8px] border border-[#e5e7eb] bg-white font-display text-[12px] font-semibold text-[#101010] hover:shadow-sm transition-shadow">
          Manage
        </button>
        <button className="flex h-8 flex-1 items-center justify-center rounded-[8px] bg-[#2B7FFF] font-display text-[12px] font-semibold text-white hover:opacity-90 transition-opacity">
          Upgrade
        </button>
      </div>
    </div>
  )
}
