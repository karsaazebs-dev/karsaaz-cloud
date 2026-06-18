import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  sub: string
  Icon: LucideIcon
}

export default function StatCard({ label, value, sub, Icon }: StatCardProps): JSX.Element {
  return (
    <div className="rounded-[16px] bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between">
        <p className="font-display text-[14px] font-medium text-[#71717b]">{label}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[rgba(13,148,136,0.1)]">
          <Icon className="h-5 w-5 text-[#0d9488]" />
        </div>
      </div>
      <p className="mt-4 font-display text-[28px] font-bold text-[#09090b]">{value}</p>
      <p className="mt-1 font-display text-[12px] text-[#71717b]">{sub}</p>
    </div>
  )
}
