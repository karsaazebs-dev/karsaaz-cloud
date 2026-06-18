import { useEffect, useState } from 'react'
import { listRequests, createRequest, reviewRequest, type StorageRequestItem } from '../services/requestsApi'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[#fef3c7] text-[#d97706]',
  approved: 'bg-[#dcfce7] text-[#16a34a]',
  rejected: 'bg-[#fee2e2] text-[#dc2626]'
}

function fmtBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(0)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`
  return `${bytes} B`
}

export default function Requests(): JSX.Element {
  const [requests, setRequests] = useState<StorageRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [requestedGb, setRequestedGb] = useState('50')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const reload = (): void => {
    setLoading(true)
    setError(null)
    listRequests()
      .then(setRequests)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load requests'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [])

  const handleSubmit = async (): Promise<void> => {
    const gb = parseInt(requestedGb, 10)
    if (!gb || gb <= 0) return
    setBusy('new')
    try {
      await createRequest(gb * 1_073_741_824, reason)
      reload()
      setShowForm(false)
      setReason('')
      setRequestedGb('50')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to submit request')
    } finally {
      setBusy(null)
    }
  }

  const handleReview = async (id: string, status: 'approved' | 'rejected'): Promise<void> => {
    setBusy(id)
    try {
      await reviewRequest(id, status)
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
    } catch {
      alert('Failed to update request')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[20px] font-bold text-[#09090b]">Storage Requests</h2>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-[8px] bg-[#2b7fff] px-4 py-2 font-display text-[13px] font-semibold text-white"
        >
          New Request
        </button>
      </div>

      {showForm && (
        <div className="rounded-[12px] bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-display text-[16px] font-semibold">Request More Storage</h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={requestedGb}
                onChange={(e) => setRequestedGb(e.target.value)}
                placeholder="Storage needed"
                className="w-32 rounded-[8px] border border-[#e5e5e5] px-4 py-2 font-display text-[14px] outline-none focus:border-[#2b7fff]"
              />
              <span className="font-display text-[14px] text-[#71717b]">GB</span>
            </div>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              className="rounded-[8px] border border-[#e5e5e5] px-4 py-2 font-display text-[14px] outline-none focus:border-[#2b7fff]"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={busy === 'new'}
                className="rounded-[8px] bg-[#2b7fff] px-4 py-2 font-display text-[13px] font-semibold text-white disabled:opacity-40"
              >
                {busy === 'new' ? 'Submitting…' : 'Submit'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-[8px] border border-[#e5e5e5] px-4 py-2 font-display text-[13px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2b7fff] border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-[12px] bg-white px-6 py-8 text-center shadow-sm">
          <p className="font-display text-[14px] text-[#ef4444]">{error}</p>
          <button onClick={reload} className="mt-3 font-display text-[13px] text-[#2b7fff] hover:underline">Retry</button>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-[16px] bg-white py-12 text-center shadow-sm">
          <p className="font-display text-[15px] text-[#71717b]">No storage requests</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-[12px] bg-white p-4 shadow-sm">
              <div className="min-w-0 flex-1">
                <p className="font-display text-[14px] font-semibold text-[#09090b]">{r.requester_uid}</p>
                <p className="truncate font-display text-[12px] text-[#71717b]">
                  {fmtBytes(r.requested_bytes)} requested
                  {r.reason ? ` · ${r.reason}` : ''}
                  {' · '}{new Date(r.created_at * 1000).toLocaleDateString()}
                </p>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-2">
                {r.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleReview(r.id, 'approved')}
                      disabled={!!busy}
                      className="rounded-[6px] bg-[#dcfce7] px-3 py-1.5 font-display text-[12px] font-medium text-[#16a34a] disabled:opacity-40"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(r.id, 'rejected')}
                      disabled={!!busy}
                      className="rounded-[6px] bg-[#fee2e2] px-3 py-1.5 font-display text-[12px] font-medium text-[#dc2626] disabled:opacity-40"
                    >
                      Reject
                    </button>
                  </>
                )}
                <span className={`rounded-[6px] px-2.5 py-1 font-display text-[12px] font-medium capitalize ${STATUS_STYLES[r.status] ?? ''}`}>
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
