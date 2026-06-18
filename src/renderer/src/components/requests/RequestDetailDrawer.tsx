import { Calendar } from 'lucide-react'
import DrawerPanel from '../ui/DrawerPanel'
import PriorityBadge, { usagePriority } from './PriorityBadge'
import RequestStatusBadge from './RequestStatusBadge'
import { fmtGb } from '../../utils/storageFormat'
import type { StorageRequestItem } from '../../services/requestsApi'

interface RequestDetailDrawerProps {
  open: boolean
  request: StorageRequestItem | null
  usedBytes?: number
  onClose: () => void
  onProceed: () => void
  onReject: () => void
  isAdmin: boolean
}

export default function RequestDetailDrawer({
  open,
  request,
  usedBytes = 0,
  onClose,
  onProceed,
  onReject,
  isAdmin
}: RequestDetailDrawerProps): JSX.Element {
  if (!request) return <></>

  const priority = usagePriority(usedBytes, request.current_bytes)
  const delta = request.requested_bytes - request.current_bytes
  const date = new Date(request.created_at * 1000).toLocaleDateString()

  return (
    <DrawerPanel open={open} title="Storage Requests" onClose={onClose} widthClass="w-[480px]">
      <div className="flex flex-1 flex-col px-6 py-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-display text-[12px] text-[#71717b]">Priority</p>
            <div className="mt-1"><PriorityBadge priority={priority} /></div>
          </div>
          <div>
            <p className="font-display text-[12px] text-[#71717b]">Current Storage</p>
            <p className="mt-1 font-display text-[16px] font-bold text-[#09090b]">{fmtGb(request.current_bytes)}</p>
          </div>
          <div>
            <p className="font-display text-[12px] text-[#71717b]">Requested</p>
            <p className="mt-1 font-display text-[16px] font-bold text-[#2b7fff]">+{fmtGb(delta)}</p>
          </div>
          <div>
            <p className="font-display text-[12px] text-[#71717b]">New Total</p>
            <p className="mt-1 font-display text-[16px] font-bold text-[#16a34a]">{fmtGb(request.requested_bytes)}</p>
          </div>
          <div>
            <p className="font-display text-[12px] text-[#71717b]">Date Requested</p>
            <p className="mt-1 font-display text-[14px] font-semibold text-[#09090b]">{date}</p>
          </div>
          <div>
            <p className="font-display text-[12px] text-[#71717b]">Status</p>
            <div className="mt-1"><RequestStatusBadge status={request.status} /></div>
          </div>
        </div>

        <div className="mt-6">
          <p className="font-display text-[13px] font-medium text-[#71717b]">Description:</p>
          <p className="mt-2 rounded-[10px] bg-[#f8fafc] p-4 font-display text-[14px] leading-relaxed text-[#09090b]">
            {request.reason || 'No description provided.'}
          </p>
        </div>

        {isAdmin && request.status === 'pending' && (
          <div className="mt-auto flex flex-col gap-3 pb-6 pt-8">
            <button
              type="button"
              onClick={onProceed}
              className="h-12 rounded-[10px] bg-gradient-to-r from-[#6366f1] to-[#2b7fff] font-display text-[15px] font-semibold text-white"
            >
              Proceed to Decision
            </button>
            <button
              type="button"
              onClick={onReject}
              className="h-12 rounded-[10px] border border-[#ef4444] font-display text-[15px] font-semibold text-[#ef4444]"
            >
              Reject Request
            </button>
            <button type="button" className="flex items-center justify-center gap-2 pt-2 font-display text-[13px] text-[#71717b] underline">
              <Calendar className="h-4 w-4" /> schedule
            </button>
          </div>
        )}
      </div>
    </DrawerPanel>
  )
}
