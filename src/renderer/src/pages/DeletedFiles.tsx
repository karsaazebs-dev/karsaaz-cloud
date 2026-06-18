import { useEffect, useState } from 'react'
import { listTrashbinFiles, restoreTrashbinFile, deleteTrashbinFile, emptyTrashbin } from '../services/filesApi'

interface TrashItem {
  id: string
  name: string
  size: number
  sizeLabel: string
  deletedAt: Date
  originalLocation: string
}

function fmtRelative(d: Date): string {
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return '1 day ago'
  if (diff < 30) return `${diff} days ago`
  return d.toLocaleDateString()
}

export default function DeletedFiles(): JSX.Element {
  const [files, setFiles] = useState<TrashItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const reload = (): void => {
    setLoading(true)
    listTrashbinFiles()
      .then(setFiles)
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [])

  const restore = async (id: string): Promise<void> => {
    setBusy(id)
    try {
      await restoreTrashbinFile(id)
      setFiles((prev) => prev.filter((f) => f.id !== id))
    } catch {
      alert('Restore failed')
    } finally {
      setBusy(null)
    }
  }

  const permanentDelete = async (id: string): Promise<void> => {
    if (!confirm('Permanently delete this file?')) return
    setBusy(id)
    try {
      await deleteTrashbinFile(id)
      setFiles((prev) => prev.filter((f) => f.id !== id))
    } catch {
      alert('Delete failed')
    } finally {
      setBusy(null)
    }
  }

  const handleEmptyTrash = async (): Promise<void> => {
    if (!confirm('Empty trash? This cannot be undone.')) return
    setBusy('all')
    try {
      await emptyTrashbin()
      setFiles([])
    } catch {
      alert('Empty trash failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[20px] font-bold text-[#09090b]">Deleted Files</h2>
        {files.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            disabled={busy === 'all'}
            className="rounded-[8px] border border-[#ef4444] px-4 py-2 font-display text-[13px] font-semibold text-[#ef4444] disabled:opacity-40"
          >
            {busy === 'all' ? 'Emptying…' : 'Empty Trash'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2b7fff] border-t-transparent" />
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-[16px] bg-white py-16 text-center shadow-sm">
          <p className="font-display text-[15px] text-[#71717b]">Trash is empty</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-[12px] bg-white p-4 shadow-sm">
              <div>
                <p className="font-display text-[14px] font-semibold text-[#09090b]">{f.name}</p>
                <p className="font-display text-[12px] text-[#71717b]">
                  {f.sizeLabel} • Deleted {fmtRelative(f.deletedAt)} • {f.originalLocation}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => restore(f.id)}
                  disabled={!!busy}
                  className="rounded-[6px] bg-[#2b7fff] px-3 py-1.5 text-[12px] text-white disabled:opacity-40"
                >
                  {busy === f.id ? '…' : 'Restore'}
                </button>
                <button
                  onClick={() => permanentDelete(f.id)}
                  disabled={!!busy}
                  className="rounded-[6px] border border-[#ef4444] px-3 py-1.5 text-[12px] text-[#ef4444] disabled:opacity-40"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
