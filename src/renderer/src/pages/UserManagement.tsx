import { useEffect, useState } from 'react'
import { listUsers, createUser, deleteUser, setUserEnabled } from '../services/usersApi'
import InviteUserModal from '../components/users/InviteUserModal'
import type { CloudUser } from '../types/files'

export default function UserManagement(): JSX.Element {
  const [users, setUsers] = useState<CloudUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [])

  const toggleStatus = async (u: CloudUser): Promise<void> => {
    setBusy(u.id)
    try {
      const newEnabled = u.status !== 'active'
      await setUserEnabled(u.id, newEnabled)
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, status: newEnabled ? 'active' : 'disabled' } : x))
    } catch {
      alert('Failed to update user')
    } finally {
      setBusy(null)
    }
  }

  const handleDeleteUser = async (id: string): Promise<void> => {
    if (!confirm('Delete this user? This cannot be undone.')) return
    setBusy(id)
    try {
      await deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch {
      alert('Failed to delete user')
    } finally {
      setBusy(null)
    }
  }

  const handleInvite = async (data: { email: string; role: string; quota: string }): Promise<void> => {
    const password = Math.random().toString(36).slice(2, 10)
    try {
      await createUser(data.email, password, parseInt(data.quota, 10))
      setUsers((prev) => [...prev, {
        id: data.email.split('@')[0],
        name: data.email.split('@')[0],
        email: data.email,
        quota: `${data.quota} GB`,
        used: '0 GB',
        role: data.role as 'admin' | 'user',
        status: 'active'
      }])
    } catch {
      alert('Failed to create user')
    }
    setShowInvite(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[20px] font-bold text-[#09090b]">User Management</h2>
        <button
          onClick={() => setShowInvite(true)}
          className="rounded-[8px] bg-[#2b7fff] px-4 py-2 font-display text-[13px] font-semibold text-white"
        >
          Invite User
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2b7fff] border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e5] bg-[#f8fafc]">
                {['User', 'Email', 'Quota', 'Used', 'Role', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display text-[12px] font-semibold uppercase tracking-wide text-[#71717b]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[#f0f0f2] last:border-0">
                  <td className="px-4 py-3 font-display text-[14px] font-semibold text-[#09090b]">{u.name}</td>
                  <td className="px-4 py-3 font-display text-[13px] text-[#71717b]">{u.email}</td>
                  <td className="px-4 py-3 font-display text-[13px] text-[#71717b]">{u.quota}</td>
                  <td className="px-4 py-3 font-display text-[13px] text-[#71717b]">{u.used}</td>
                  <td className="px-4 py-3 font-display text-[13px] capitalize text-[#71717b]">{u.role}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-[6px] px-2 py-0.5 text-[11px] font-medium ${
                      u.status === 'active' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#f3f4f6] text-[#6b7280]'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleStatus(u)}
                        disabled={busy === u.id}
                        className="text-[12px] text-[#2b7fff] disabled:opacity-40"
                      >
                        {u.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={!!busy}
                        className="text-[12px] text-[#ef4444] disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showInvite && (
        <InviteUserModal onClose={() => setShowInvite(false)} onInvite={handleInvite} />
      )}
    </div>
  )
}
