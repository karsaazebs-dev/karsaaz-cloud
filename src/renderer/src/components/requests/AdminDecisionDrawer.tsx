import { useState, useEffect } from 'react'
import { MessageCircle, Minus, Plus } from 'lucide-react'
import DrawerPanel from '../ui/DrawerPanel'
import { fmtGb } from '../../utils/storageFormat'
import type { StorageRequestItem } from '../../services/requestsApi'

const CHIPS = [10, 25, 50, 100, 200, 500]

interface AdminDecisionDrawerProps {
  open: boolean
  request: StorageRequestItem | null
  onClose: () => void
  onApprove: (newTotalBytes: number, notes: string) => Promise<void>
  onReject: () => Promise<void>
}

export default function AdminDecisionDrawer({
  open,
  request,
  onClose,
  onApprove,
  onReject
}: AdminDecisionDrawerProps): JSX.Element {
  const [increaseGb, setIncreaseGb] = useState(100)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (request && open) {
      const deltaGb = Math.max(1, Math.round((request.requested_bytes - request.current_bytes) / 1_073_741_824))
      setIncreaseGb(deltaGb)
      setNotes('')
    }
  }, [request, open])

  if (!request) return <></>

  const currentBytes = request.current_bytes
  const requestedDelta = request.requested_bytes - request.current_bytes
  const newTotalBytes = currentBytes + increaseGb * 1_073_741_824

  const handleApprove = async (): Promise<void> => {
    setBusy(true)
    try {
      await onApprove(newTotalBytes, notes)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const handleReject = async (): Promise<void> => {
    setBusy(true)
    try {
      await onReject()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <DrawerPanel open={open} onClose={onClose} widthClass="w-[500px]">
      <div className="border-b border-[#e5e5e5] px-6 py-5">
        <h2 className="font-display text-[22px] font-bold text-[#09090b]">Admin Decision</h2>
        <p className="mt-1 font-display text-[13px] text-[#71717b]">Set the approved storage amount and take action</p>
      </div>

      <div className="flex flex-1 flex-col gap-5 px-6 py-5">
        <div>
          <p className="mb-3 font-display text-[13px] font-medium text-[#71717b]">Storage Increase Amount</p>
          <div className="flex items-center justify-center gap-4">
            <button type="button" onClick={() => setIncreaseGb((v) => Math.max(1, v - 10))} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e5e5]">
              <Minus className="h-4 w-4" />
            </button>
            <div className="rounded-[10px] border border-[#e5e5e5] px-6 py-3 font-display text-[20px] font-bold text-[#09090b]">
              {increaseGb} GB
            </div>
            <button type="button" onClick={() => setIncreaseGb((v) => v + 10)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e5e5]">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {CHIPS.map((gb) => (
              <button
                key={gb}
                type="button"
                onClick={() => setIncreaseGb(gb)}
                className={`rounded-[8px] py-2 font-display text-[13px] font-semibold ${
                  increaseGb === gb ? 'bg-[#2b7fff] text-white' : 'border border-[#e5e5e5] text-[#09090b]'
                }`}
              >
                +{gb} GB
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[12px] bg-[#eff6ff] p-4 font-display text-[13px]">
          <div className="flex justify-between py-1"><span className="text-[#71717b]">Current</span><span className="font-semibold">{fmtGb(currentBytes)}</span></div>
          <div className="flex justify-between py-1"><span className="text-[#71717b]">Requested</span><span className="font-semibold">{fmtGb(requestedDelta)}</span></div>
          <div className="flex justify-between py-1"><span className="text-[#71717b]">Increase</span><span className="font-semibold text-[#2b7fff]">+{increaseGb} GB</span></div>
          <div className="my-2 border-t border-[#dbeafe]" />
          <div className="flex justify-between py-1">
            <span className="font-semibold text-[#09090b]">New Total</span>
            <span className="text-[18px] font-bold text-[#6366f1]">{fmtGb(newTotalBytes)}</span>
          </div>
        </div>

        <div>
          <label className="mb-2 block font-display text-[11px] font-semibold tracking-wide text-[#71717b]">ADMIN NOTES</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note for this decision (optional)..."
            className="min-h-[100px] w-full rounded-[10px] border border-[#e5e5e5] bg-[#f8fafc] px-4 py-3 font-display text-[14px] outline-none focus:border-[#2b7fff]"
          />
        </div>

        <div className="mt-auto flex flex-col gap-3 pb-6">
          <button
            type="button"
            disabled={busy}
            onClick={handleApprove}
            className="h-12 rounded-[10px] bg-gradient-to-r from-[#6366f1] to-[#2b7fff] font-display text-[15px] font-semibold text-white disabled:opacity-50"
          >
            Approve +{increaseGb} GB
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleReject}
            className="h-12 rounded-[10px] border border-[#ef4444] font-display text-[15px] font-semibold text-[#ef4444] disabled:opacity-50"
          >
            Reject Request
          </button>
          <button type="button" className="flex items-center justify-center gap-2 pt-2 font-display text-[13px] text-[#71717b] underline">
            <MessageCircle className="h-4 w-4" /> Ask for More Info
          </button>
        </div>
      </div>
    </DrawerPanel>
  )
}
