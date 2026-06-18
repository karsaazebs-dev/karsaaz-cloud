interface UsageProgressBarProps {
  usedBytes: number
  totalBytes: number
  showLabel?: boolean
}

export default function UsageProgressBar({ usedBytes, totalBytes, showLabel = true }: UsageProgressBarProps): JSX.Element {
  const pct = totalBytes > 0 ? Math.min(100, Math.round((usedBytes / totalBytes) * 100)) : 0
  const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#2b7fff'
  const usedGb = (usedBytes / 1_073_741_824).toFixed(0)

  return (
    <div className="min-w-[140px]">
      {showLabel && (
        <p className="mb-1 font-display text-[12px] text-[#71717b]">{usedGb} GB used</p>
      )}
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e5e7eb]">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <span className="w-8 font-display text-[12px] font-semibold text-[#09090b]">{pct}%</span>
      </div>
    </div>
  )
}
