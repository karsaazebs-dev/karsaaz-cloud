import { useEffect, useState } from 'react'
import type { SyncFolder } from '../types/files'

const DEFAULT_FOLDERS: SyncFolder[] = [
  { id: '1', localPath: 'C:\\Users\\Documents\\Karsaaz', remotePath: '/Documents', status: 'synced', lastSynced: '2 min ago' },
  { id: '2', localPath: 'C:\\Users\\Desktop\\Projects', remotePath: '/Projects', status: 'syncing', lastSynced: 'Syncing…' }
]

export default function OnDevice(): JSX.Element {
  const [folders, setFolders] = useState<SyncFolder[]>(DEFAULT_FOLDERS)

  useEffect(() => {
    window.api.store.get('syncFolders').then((stored) => {
      if (stored && Array.isArray(stored)) setFolders(stored as SyncFolder[])
    })
  }, [])

  const saveFolders = async (updated: SyncFolder[]): Promise<void> => {
    setFolders(updated)
    await window.api.store.set('syncFolders', updated)
  }

  const removeFolder = (id: string): void => {
    saveFolders(folders.filter((f) => f.id !== id))
  }

  const addFolder = (): void => {
    const newFolder: SyncFolder = {
      id: `sync-${Date.now()}`,
      localPath: 'C:\\Users\\NewFolder',
      remotePath: '/NewFolder',
      status: 'synced',
      lastSynced: 'Just now'
    }
    saveFolders([...folders, newFolder])
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

      <div className="flex flex-col gap-3">
        {folders.map((f) => (
          <div key={f.id} className="flex items-center justify-between rounded-[12px] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-1">
              <p className="font-display text-[14px] font-semibold text-[#09090b]">{f.localPath}</p>
              <p className="font-display text-[12px] text-[#71717b]">↔ {f.remotePath}</p>
              {f.lastSynced && <p className="font-display text-[11px] text-[#71717b]">Last synced: {f.lastSynced}</p>}
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
    </div>
  )
}
