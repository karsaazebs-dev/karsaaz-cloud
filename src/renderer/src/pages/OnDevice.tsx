import { useCallback, useEffect, useState } from 'react'
import { FolderSync, FolderOpen, Pause, Play, RefreshCw, Trash2, HardDrive, Cloud } from 'lucide-react'
import type { SyncFolder } from '../types/files'
import AddSyncFolderDrawer from '../components/sync/AddSyncFolderDrawer'

export default function OnDevice(): JSX.Element {
  const [folders, setFolders] = useState<SyncFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  const reload = useCallback((): void => {
    window.api.syncFolders.list()
      .then((f) => setFolders(f.map((x) => ({
        id: x.id,
        localPath: x.localPath,
        remotePath: x.remotePath,
        status: x.status as SyncFolder['status'],
        lastSynced: x.lastSynced,
        error: x.error
      }))))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
    const unsub = window.api.syncFolders.onUpdated(reload)
    return unsub
  }, [reload])

  const addFolder = async (localPath: string, remotePath: string): Promise<void> => {
    await window.api.syncFolders.add(localPath, remotePath)
    reload()
  }

  const removeFolder = async (id: string): Promise<void> => {
    setActionId(id)
    try {
      await window.api.syncFolders.remove(id)
      reload()
    } finally {
      setActionId(null)
    }
  }

  const syncNow = async (id: string): Promise<void> => {
    setActionId(id)
    try {
      await window.api.syncFolders.runNow(id)
      reload()
    } finally {
      setActionId(null)
    }
  }

  const togglePause = async (folder: SyncFolder): Promise<void> => {
    const next = folder.status === 'paused' ? 'synced' : 'paused'
    await window.api.syncFolders.updateStatus(folder.id, next)
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
      <span className={`rounded-full px-2.5 py-0.5 font-display text-[11px] font-semibold capitalize ${styles[status]}`}>
        {status}
      </span>
    )
  }

  const folderName = (path: string): string => {
    const parts = path.replace(/\\/g, '/').split('/').filter(Boolean)
    return parts[parts.length - 1] ?? path
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-bold text-[#09090b]">On Device</h1>
          <p className="mt-1 font-display text-[14px] text-[#71717b]">
            Keep local folders in sync with your Karsaaz Cloud storage
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="h-10 rounded-[10px] bg-[#2b7fff] px-4 font-display text-[13px] font-semibold text-white hover:opacity-90"
        >
          Add Sync Folder
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2b7fff] border-t-transparent" />
        </div>
      ) : folders.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[#d4d4d8] bg-white py-20 text-center shadow-sm">
          <FolderSync className="mx-auto mb-4 h-12 w-12 text-[#a1a1aa]" />
          <p className="font-display text-[16px] font-semibold text-[#09090b]">No sync folders configured</p>
          <p className="mt-1 font-display text-[14px] text-[#71717b]">
            Click &quot;Add Sync Folder&quot; to link a folder on this PC with Karsaaz Cloud
          </p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="mt-6 rounded-[10px] bg-[#2b7fff] px-5 py-2.5 font-display text-[13px] font-semibold text-white"
          >
            Add Sync Folder
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {folders.map((f) => (
            <div key={f.id} className="overflow-hidden rounded-[18px] border border-[rgba(15,23,42,0.08)] bg-white shadow-sm">
              <div className="flex items-start justify-between gap-4 px-6 py-5">
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#eef2ff]">
                    <FolderSync className="h-5 w-5 text-[#6366f1]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-[16px] font-semibold text-[#09090b]">{folderName(f.localPath)}</p>
                      {statusBadge(f.status)}
                    </div>
                    <div className="mt-2 flex flex-col gap-1.5">
                      <p className="flex items-center gap-2 font-display text-[13px] text-[#71717b]">
                        <HardDrive className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{f.localPath}</span>
                      </p>
                      <p className="flex items-center gap-2 font-display text-[13px] text-[#71717b]">
                        <Cloud className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{f.remotePath}</span>
                      </p>
                    </div>
                    {f.lastSynced && (
                      <p className="mt-2 font-display text-[12px] text-[#a1a1aa]">
                        Last synced: {new Date(f.lastSynced).toLocaleString()}
                      </p>
                    )}
                    {f.error && (
                      <p className="mt-2 font-display text-[12px] text-[#ef4444]">{f.error}</p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <IconBtn title="Open local folder" onClick={() => window.api.syncFolders.openLocal(f.localPath)}>
                    <FolderOpen className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn title="Sync now" disabled={actionId === f.id} onClick={() => syncNow(f.id)}>
                    <RefreshCw className={`h-4 w-4 ${f.status === 'syncing' ? 'animate-spin' : ''}`} />
                  </IconBtn>
                  <IconBtn title={f.status === 'paused' ? 'Resume' : 'Pause'} onClick={() => togglePause(f)}>
                    {f.status === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </IconBtn>
                  <IconBtn title="Remove" disabled={actionId === f.id} onClick={() => removeFolder(f.id)}>
                    <Trash2 className="h-4 w-4 text-[#ef4444]" />
                  </IconBtn>
                </div>
              </div>
              {f.status === 'syncing' && (
                <div className="h-1 bg-[#e5e7eb]">
                  <div className="h-full w-1/2 animate-pulse bg-gradient-to-r from-[#6366f1] to-[#2b7fff]" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AddSyncFolderDrawer open={showAdd} onClose={() => setShowAdd(false)} onSubmit={addFolder} />
    </div>
  )
}

function IconBtn({
  children,
  title,
  onClick,
  disabled
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
  disabled?: boolean
}): JSX.Element {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="rounded-[8px] p-2 text-[#71717b] hover:bg-[#f3f4f6] disabled:opacity-40"
    >
      {children}
    </button>
  )
}
