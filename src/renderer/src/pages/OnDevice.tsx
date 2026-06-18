import { useEffect, useState } from 'react'
import type { SyncFolder } from '../types/files'

export default function OnDevice(): JSX.Element {
  const [folders, setFolders] = useState<SyncFolder[]>([])
  const [loading, setLoading] = useState(true)

  const reload = (): void => {
    window.api.syncFolders.list()
      .then((f) => setFolders(f.map((x) => ({
        id: x.id,
        localPath: x.localPath,
        remotePath: x.remotePath,
        status: x.status as SyncFolder['status'],
        lastSynced: x.lastSynced
      }))))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
    const unsub = window.api.sync.onStatus(() => reload())
    return unsub
  }, [])

  const removeFolder = async (id: string): Promise<void> => {
    await window.api.syncFolders.remove(id)
    reload()
  }

  const addFolder = async (): Promise<void> => {
    const localPath = prompt('Local folder path (e.g. C:\\Users\\Me\\Documents):')
    if (!localPath) return
    const remotePath = prompt('Remote Nextcloud path (e.g. /Documents):', '/') ?? '/'
    await window.api.syncFolders.add(localPath, remotePath)
    reload()
  }

  const statusBadge = (status: SyncFolder['status']): JSX.Element => {
    const styles = {
      synced: 'bg-[#dcfce7] text-[#16a34a]',
      syncing: 'bg-[#dbeafe] text-[#2563eb]',
      error: 'bg-[#fee2e2] text-[#dc2626]',
      paused: 'bg-[#f3f4f6] text-[#6b7280]'
    }
    return (
      <span className={`rounded-[6px] px-2 py-0.5 font-display text-[11px] font-medium capitalize ${styles[status]}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[20px] font-bold text-[#09090b]">On Device</h2>
        <button
          onClick={addFolder}
          className="rounded-[8px] bg-[#2b7fff] px-4 py-2 font-display text-[13px] font-semibold text-white"
        >
          Add Sync Folder
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2b7fff] border-t-transparent" />
        </div>
      ) : folders.length === 0 ? (
        <div className="rounded-[16px] bg-white py-12 text-center shadow-sm">
          <p className="font-display text-[15px] text-[#71717b]">No sync folders configured</p>
          <p className="mt-1 font-display text-[13px] text-[#71717b]">Click "Add Sync Folder" to start syncing</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {folders.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-[12px] bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-1">
                <p className="font-display text-[14px] font-semibold text-[#09090b]">{f.localPath}</p>
                <p className="font-display text-[12px] text-[#71717b]">↔ {f.remotePath}</p>
                {f.lastSynced && (
                  <p className="font-display text-[11px] text-[#71717b]">
                    Last synced: {new Date(f.lastSynced).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {statusBadge(f.status)}
                <button
                  onClick={() => removeFolder(f.id)}
                  className="rounded-[6px] border border-[#e5e5e5] px-3 py-1 font-display text-[12px] text-[#ef4444]"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
