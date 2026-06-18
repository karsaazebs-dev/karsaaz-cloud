type Priority = 'high' | 'medium' | 'low'

const STYLES: Record<Priority, string> = {
  high: 'bg-[#fee2e2] text-[#dc2626]',
  medium: 'bg-[#fef3c7] text-[#d97706]',
  low: 'bg-[#f3f4f6] text-[#6b7280]'
}

export function usagePriority(usedBytes: number, totalBytes: number): Priority {
  if (totalBytes <= 0) return 'medium'
  const pct = (usedBytes / totalBytes) * 100
  if (pct >= 90) return 'high'
  if (pct >= 70) return 'medium'
  return 'low'
}

export default function PriorityBadge({ priority }: { priority: Priority }): JSX.Element {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 font-display text-[12px] font-medium capitalize ${STYLES[priority]}`}>
      {priority}
    </span>
  )
}
