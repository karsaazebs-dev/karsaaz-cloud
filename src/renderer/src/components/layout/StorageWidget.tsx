import { useEffect, useState } from 'react'
import { getQuota, getStorageBreakdown } from '../../services/storageApi'
import type { StorageStats, StorageBreakdown } from '../../services/storageApi'

const COLORS = ['#2B7FFF', '#a78bfa', '#34d399', '#f59e0b']

export default function StorageWidget(): JSX.Element {
  const [quota, setQuota] = useState<StorageStats | null>(null)
  const [breakdown, setBreakdown] = useState<StorageBreakdown[]>([])
  const [syncStatus, setSyncStatus] = useState<string>('active')

  useEffect(() => {
    getQuota().then(setQuota)
    getStorageBreakdown().then(setBreakdown)
    window.api.sync.getStatus().then(setSyncStatus)
    const unsub = window.api.sync.onStatus(setSyncStatus)
    return unsub
  }, [])

  const used = quota ? quota.used / 1073741824 : 0
  const total = quota ? quota.total / 1073741824 : 500

  return (
    <div className="mx-3 mb-4 rounded-[14px] border border-[#e5e7eb] bg-[#f8fafc] p-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-[13px] font-semibold text-[#101010]">Storage</p>
        <span className={`flex items-center gap-1 font-display text-[11px] font-medium ${
          syncStatus === 'paused' ? 'text-[#f59e0b]' : 'text-[#22c55e]'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${syncStatus === 'paused' ? 'bg-[#f59e0b]' : 'bg-[#22c55e]'}`} />
          {syncStatus === 'paused' ? 'Paused' : 'Synced'}
        </span>
      </div>
      <p className="mt-0.5 font-display text-[12px] font-medium text-[#6b7280]">
        {quota ? `${quota.usedLabel} of ${quota.totalLabel} used` : 'Loading…'}
      </p>

      <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-[#e5e7eb]">
        {breakdown.map((seg, i) => (
          <div
            key={seg.label}
            className="h-full"
            style={{ width: `${seg.percentage}%`, background: COLORS[i % COLORS.length] }}
          />
        ))}
        {breakdown.length === 0 && total > 0 && (
          <div className="h-full bg-[#2B7FFF]" style={{ width: `${Math.min((used / total) * 100, 100)}%` }} />
        )}
      </div>

      <div className="mt-3 flex flex-col gap-1">
        {breakdown.slice(0, 3).map((seg, i) => (
          <div key={seg.label} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="font-display text-[12px] font-medium text-[#6b7280]">{seg.label}</span>
            </div>
            <span className="font-display text-[12px] font-semibold text-[#101010]">{seg.label_size}</span>
          </div>
        ))}
      </div>

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
