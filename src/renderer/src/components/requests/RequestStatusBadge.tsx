import { Check, Clock, X } from 'lucide-react'

interface RequestStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected'
}

export default function RequestStatusBadge({ status }: RequestStatusBadgeProps): JSX.Element {
  const styles = {
    pending: 'bg-[#fef3c7] text-[#d97706]',
    approved: 'bg-[#dcfce7] text-[#16a34a]',
    rejected: 'bg-[#fee2e2] text-[#dc2626]'
  }
  const Icon = status === 'approved' ? Check : status === 'rejected' ? X : Clock

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-display text-[12px] font-medium capitalize ${styles[status]}`}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  )
}
