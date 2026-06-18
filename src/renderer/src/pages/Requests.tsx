import { useEffect, useState } from 'react'
import { ChevronRight, HardDrive, Search } from 'lucide-react'
import {
  listRequests,
  createRequest,
  reviewRequest,
  getManagedUsers,
  getMyQuota,
  type StorageRequestItem,
  type StorageType
} from '../services/requestsApi'
import { useIsAdmin } from '../hooks/useIsAdmin'
import PriorityBadge, { usagePriority } from '../components/requests/PriorityBadge'
import RequestStatusBadge from '../components/requests/RequestStatusBadge'
import RequestDetailDrawer from '../components/requests/RequestDetailDrawer'
import AdminDecisionDrawer from '../components/requests/AdminDecisionDrawer'
import UsageProgressBar from '../components/users/UsageProgressBar'
import DrawerPanel from '../components/ui/DrawerPanel'
import { fmtGb, initials, relativeTime } from '../utils/storageFormat'

const STORAGE_LABELS: Record<StorageType, string> = {
  general: 'General purpose',
  documents: 'Documents (PDF, TXT, Office)',
  media: 'Media (images, video)'
}

export default function Requests(): JSX.Element {
  const { isAdmin, loading: adminLoading } = useIsAdmin()
  const [requests, setRequests] = useState<StorageRequestItem[]>([])
  const [usageByUid, setUsageByUid] = useState<Record<string, { used: number; total: number }>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<StorageRequestItem | null>(null)
  const [showDecision, setShowDecision] = useState(false)
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [additionalGb, setAdditionalGb] = useState('100')
  const [reason, setReason] = useState('')
  const [storageType, setStorageType] = useState<StorageType>('general')
  const [currentBytes, setCurrentBytes] = useState(0)

  const reload = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const [reqs, usageSource] = await Promise.all([
        listRequests(),
        isAdmin ? getManagedUsers() : getMyQuota().then((u) => [u])
      ])
      setRequests(reqs)
      const map: Record<string, { used: number; total: number }> = {}
      for (const m of usageSource) {
        map[m.uid] = { used: m.used_bytes, total: m.allocated_bytes }
      }
      setUsageByUid(map)
      if (!isAdmin && usageSource[0]) {
        setCurrentBytes(usageSource[0].allocated_bytes)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!adminLoading) reload()
  }, [adminLoading, isAdmin])

  const filtered = requests.filter((r) => {
    const q = search.toLowerCase()
    return r.requester_uid.toLowerCase().includes(q) || (r.reason ?? '').toLowerCase().includes(q)
  })

  const handleCreate = async (): Promise<void> => {
    const gb = parseInt(additionalGb, 10)
    if (!gb || gb <= 0) return
    await createRequest(0, currentBytes + gb * 1_073_741_824, reason, storageType)
    setShowNewRequest(false)
    reload()
  }

  const handleReject = async (id: string, notes?: string): Promise<void> => {
    await reviewRequest(id, 'rejected', undefined, notes)
    setSelected(null)
    reload()
  }

  const handleApprove = async (newTotalBytes: number, notes: string): Promise<void> => {
    if (!selected) return
    await reviewRequest(selected.id, 'approved', newTotalBytes, notes)
    setSelected(null)
    setShowDecision(false)
    reload()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[28px] font-bold text-[#09090b]">Storage Request</h1>
        {!isAdmin && (
          <button
            type="button"
            onClick={() => setShowNewRequest(true)}
            className="h-10 rounded-[10px] bg-[#2b7fff] px-4 font-display text-[13px] font-semibold text-white"
          >
            New Request
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-[18px] border border-[rgba(15,23,42,0.08)] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[rgba(15,23,42,0.08)] px-6 py-4">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-[16px] font-semibold text-[#0f172a]">All Users</h3>
            <span className="rounded-full bg-[#eef2ff] px-2.5 py-0.5 font-display text-[13px] font-medium text-[#4f39f6]">
              {filtered.length}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a1a1aa]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="h-10 w-48 rounded-[10px] border border-[#e5e5e5] pl-9 pr-3 font-display text-[13px] outline-none focus:border-[#2b7fff]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2b7fff] border-t-transparent" />
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="font-display text-[14px] text-[#ef4444]">{error}</p>
            <button type="button" onClick={reload} className="mt-3 font-display text-[13px] text-[#2b7fff]">Retry</button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f0f2] bg-[#fafafa]">
                {['USER', 'PRIORITY', 'CURRENT STORAGE', 'USED', 'REQUESTED', 'NEW TOTAL', 'SUBMITTED', 'STATUS', ''].map((h) => (
                  <th key={h || 'a'} className="px-4 py-3 text-left font-display text-[11px] font-semibold tracking-wide text-[#71717b]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const usage = usageByUid[r.requester_uid] ?? { used: 0, total: r.current_bytes }
                const priority = usagePriority(usage.used, usage.total || r.current_bytes)
                const delta = r.requested_bytes - r.current_bytes
                return (
                  <tr
                    key={r.id}
                    className="cursor-pointer border-b border-[#f0f0f2] hover:bg-[#fafafa]"
                    onClick={() => setSelected(r)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef2ff] text-[12px] font-semibold text-[#4f39f6]">
                          {initials(r.requester_uid)}
                        </div>
                        <div>
                          <p className="font-display text-[13px] font-semibold text-[#09090b]">{r.requester_uid}</p>
                          <p className="font-display text-[11px] text-[#71717b]">{r.requester_uid}@karsaaz.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><PriorityBadge priority={priority} /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 font-display text-[13px] text-[#09090b]">
                        <HardDrive className="h-4 w-4 text-[#71717b]" />
                        {fmtGb(r.current_bytes)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <UsageProgressBar usedBytes={usage.used} totalBytes={usage.total || r.current_bytes} />
                    </td>
                    <td className="px-4 py-4 font-display text-[13px] font-semibold text-[#2b7fff]">+{fmtGb(delta)}</td>
                    <td className="px-4 py-4 font-display text-[13px] font-semibold text-[#09090b]">{fmtGb(r.requested_bytes)}</td>
                    <td className="px-4 py-4 font-display text-[12px] text-[#71717b]">{relativeTime(r.created_at)}</td>
                    <td className="px-4 py-4"><RequestStatusBadge status={r.status} /></td>
                    <td className="px-4 py-4"><ChevronRight className="h-5 w-5 text-[#a1a1aa]" /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        <div className="flex items-center justify-between border-t border-[#f0f0f2] px-6 py-3">
          <p className="font-display text-[12px] text-[#71717b]">Showing {filtered.length} of {requests.length} users</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2b7fff] text-[12px] font-semibold text-white">1</div>
        </div>
      </div>

      <RequestDetailDrawer
        open={selected !== null && !showDecision}
        request={selected}
        usedBytes={selected ? (usageByUid[selected.requester_uid]?.used ?? 0) : 0}
        onClose={() => setSelected(null)}
        onProceed={() => setShowDecision(true)}
        onReject={() => selected && handleReject(selected.id)}
        isAdmin={isAdmin}
      />

      <AdminDecisionDrawer
        open={showDecision && selected !== null}
        request={selected}
        onClose={() => setShowDecision(false)}
        onApprove={handleApprove}
        onReject={() => (selected ? handleReject(selected.id) : Promise.resolve())}
      />

      <DrawerPanel open={showNewRequest} title="Request More Storage" onClose={() => setShowNewRequest(false)} widthClass="w-[440px]">
        <div className="flex flex-col gap-4 px-6 py-5">
          <p className="font-display text-[13px] text-[#71717b]">Current: {fmtGb(currentBytes)}</p>
          <select
            value={storageType}
            onChange={(e) => setStorageType(e.target.value as StorageType)}
            className="rounded-[10px] border border-[#e5e5e5] px-4 py-2.5 font-display text-[14px]"
          >
            {(Object.keys(STORAGE_LABELS) as StorageType[]).map((k) => (
              <option key={k} value={k}>{STORAGE_LABELS[k]}</option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={additionalGb}
            onChange={(e) => setAdditionalGb(e.target.value)}
            className="rounded-[10px] border border-[#e5e5e5] px-4 py-2.5 font-display text-[14px]"
            placeholder="Additional GB"
          />
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
            className="min-h-[100px] rounded-[10px] border border-[#e5e5e5] px-4 py-3 font-display text-[14px]"
          />
          <button type="button" onClick={handleCreate} className="h-11 rounded-[10px] bg-[#2b7fff] font-display text-[14px] font-semibold text-white">
            Submit Request
          </button>
        </div>
      </DrawerPanel>
    </div>
  )
}
