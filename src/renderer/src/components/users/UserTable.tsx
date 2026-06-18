import { ChevronRight, Search } from 'lucide-react'
import RoleBadge from './RoleBadge'
import UsageProgressBar from './UsageProgressBar'
import { fmtGb, initials } from '../../utils/storageFormat'

export interface UserRowData {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'disabled'
  allocatedBytes: number
  usedBytes: number
}

interface UserTableProps {
  users: UserRowData[]
  search: string
  onSearchChange: (v: string) => void
  onAddUser: () => void
  onRowClick?: (user: UserRowData) => void
}

export default function UserTable({ users, search, onSearchChange, onAddUser, onRowClick }: UserTableProps): JSX.Element {
  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)
  })

  return (
    <div className="overflow-hidden rounded-[18px] border border-[rgba(15,23,42,0.08)] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[rgba(15,23,42,0.08)] px-6 py-4">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-[16px] font-semibold text-[#0f172a]">All Users</h3>
          <span className="rounded-full bg-[#eef2ff] px-2.5 py-0.5 font-display text-[13px] font-medium text-[#4f39f6]">
            {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a1a1aa]" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search users..."
              className="h-10 w-56 rounded-[10px] border border-[#e5e5e5] pl-9 pr-3 font-display text-[13px] outline-none focus:border-[#2b7fff]"
            />
          </div>
          <button
            type="button"
            onClick={onAddUser}
            className="h-10 rounded-[10px] bg-[#2b7fff] px-4 font-display text-[13px] font-semibold text-white"
          >
            + Add User
          </button>
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-[#f0f0f2] bg-[#fafafa]">
            {['USER', 'ROLE', 'ALLOCATED', 'USAGE', 'STATUS', ''].map((h) => (
              <th key={h || 'actions'} className="px-6 py-3 text-left font-display text-[11px] font-semibold tracking-wide text-[#71717b]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((u) => (
            <tr
              key={u.id}
              className="cursor-pointer border-b border-[#f0f0f2] last:border-0 hover:bg-[#fafafa]"
              onClick={() => onRowClick?.(u)}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef2ff] font-display text-[13px] font-semibold text-[#4f39f6]">
                    {initials(u.name || u.id)}
                  </div>
                  <div>
                    <p className="font-display text-[14px] font-semibold text-[#09090b]">{u.name || u.id}</p>
                    <p className="font-display text-[12px] text-[#71717b]">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
              <td className="px-6 py-4 font-display text-[14px] font-medium text-[#09090b]">{fmtGb(u.allocatedBytes)}</td>
              <td className="px-6 py-4">
                <UsageProgressBar usedBytes={u.usedBytes} totalBytes={u.allocatedBytes} />
              </td>
              <td className="px-6 py-4">
                <span className={`rounded-full px-3 py-1 font-display text-[12px] font-medium ${
                  u.status === 'active' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#f3f4f6] text-[#6b7280]'
                }`}>
                  {u.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <ChevronRight className="ml-auto h-5 w-5 text-[#a1a1aa]" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t border-[#f0f0f2] px-6 py-3">
        <p className="font-display text-[12px] text-[#71717b]">Showing {filtered.length} of {users.length} users</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2b7fff] font-display text-[12px] font-semibold text-white">1</div>
      </div>
    </div>
  )
}
