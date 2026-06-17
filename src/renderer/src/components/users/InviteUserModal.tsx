import { useEffect, useState } from 'react'

interface InviteUserModalProps {
  onClose: () => void
  onInvite: (data: { email: string; role: string; quota: string }) => void
}

export default function InviteUserModal({ onClose, onInvite }: InviteUserModalProps): JSX.Element {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('user')
  const [quota, setQuota] = useState('100')

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-[440px] rounded-[16px] bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 font-display text-[18px] font-bold text-[#09090b]">Invite User</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block font-display text-[13px] font-medium text-[#71717b]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[8px] border border-[#e5e5e5] px-4 py-2.5 font-display text-[14px] outline-none focus:border-[#2b7fff]"
              placeholder="user@karsaaz.com"
            />
          </div>
          <div>
            <label className="mb-1 block font-display text-[13px] font-medium text-[#71717b]">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-[8px] border border-[#e5e5e5] px-4 py-2.5 font-display text-[14px] outline-none"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block font-display text-[13px] font-medium text-[#71717b]">Storage Quota (GB)</label>
            <input
              type="number"
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              className="w-full rounded-[8px] border border-[#e5e5e5] px-4 py-2.5 font-display text-[14px] outline-none focus:border-[#2b7fff]"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-[8px] border border-[#e5e5e5] px-4 py-2 font-display text-[13px]">Cancel</button>
          <button
            onClick={() => onInvite({ email, role, quota })}
            disabled={!email}
            className="rounded-[8px] bg-[#2b7fff] px-4 py-2 font-display text-[13px] font-semibold text-white disabled:opacity-50"
          >
            Send Invite
          </button>
        </div>
      </div>
    </div>
  )
}
