import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getPool, getManagedUsers, provisionUser } from '../services/quotaAllocationApi'
import { useIsAdmin } from '../hooks/useIsAdmin'
import UserStatsCards from '../components/users/UserStatsCards'
import UserTable, { type UserRowData } from '../components/users/UserTable'
import AddUserDrawer, { type AddUserFormData } from '../components/users/AddUserDrawer'
import UserCreatedDrawer from '../components/users/UserCreatedDrawer'

export default function UserManagement(): JSX.Element {
  const { isAdmin, loading: adminLoading } = useIsAdmin()
  const [rows, setRows] = useState<UserRowData[]>([])
  const [pool, setPool] = useState({ total: 0, distributed: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [createdCreds, setCreatedCreds] = useState<{ username: string; password: string } | null>(null)

  const reload = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const [managedList, poolInfo] = await Promise.all([getManagedUsers(), getPool()])
      setRows(
        managedList.map((m) => ({
          id: m.uid,
          name: m.displayName,
          email: m.email,
          role: m.role,
          status: m.enabled ? 'active' : 'disabled',
          allocatedBytes: m.allocated_bytes,
          usedBytes: m.used_bytes
        }))
      )
      setPool({ total: poolInfo.total_bytes, distributed: poolInfo.distributed_bytes })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load user management data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) reload()
  }, [isAdmin])

  const handleCreate = async (data: AddUserFormData): Promise<void> => {
    await provisionUser({
      userid: data.username,
      password: data.password,
      displayName: data.fullName.trim() || undefined,
      email: data.email.trim() || undefined,
      quota_gb: data.quotaGb,
      storage_type: data.storageType,
      profile: {
        uploadType: data.uploadType,
        platformAccess: data.platformAccess,
        networkBinding: data.networkBinding,
        geoRestriction: data.geoRestriction,
        ipFrom: data.ipFrom,
        ipTo: data.ipTo,
        uploadLimitEnabled: data.uploadLimitEnabled,
        uploadLimits: data.uploadLimits
      }
    })
    setCreatedCreds({ username: data.username, password: data.password })
    await reload()
  }

  if (adminLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2b7fff] border-t-transparent" />
      </div>
    )
  }

  if (!isAdmin) return <Navigate to="/app/dashboard" replace />

  const activeCount = rows.filter((r) => r.status === 'active').length
  const maxQuotaGb = Math.max(10, Math.floor((pool.total - pool.distributed) / 1_073_741_824))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[28px] font-bold text-[#09090b]">User Management</h1>

      <UserStatsCards
        totalUsers={rows.length}
        activeUsers={activeCount}
        serverStorageBytes={pool.total}
        allocatedBytes={pool.distributed}
      />

      {error ? (
        <div className="rounded-[12px] bg-white px-6 py-8 text-center shadow-sm">
          <p className="font-display text-[14px] text-[#ef4444]">{error}</p>
          <button type="button" onClick={reload} className="mt-3 font-display text-[13px] text-[#2b7fff] hover:underline">Retry</button>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2b7fff] border-t-transparent" />
        </div>
      ) : (
        <UserTable
          users={rows}
          search={search}
          onSearchChange={setSearch}
          onAddUser={() => setShowAdd(true)}
        />
      )}

      <AddUserDrawer
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={handleCreate}
        maxQuotaGb={maxQuotaGb}
      />

      <UserCreatedDrawer
        open={createdCreds !== null}
        username={createdCreds?.username ?? ''}
        password={createdCreds?.password ?? ''}
        onClose={() => setCreatedCreds(null)}
      />
    </div>
  )
}
