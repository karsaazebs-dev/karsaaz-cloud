import { useState } from 'react'
import { FolderOpen } from 'lucide-react'
import DrawerPanel from '../ui/DrawerPanel'
import MoveFolderDialog from '../ui/MoveFolderDialog'

interface AddSyncFolderDrawerProps {
  open: boolean
  onClose: () => void
  onSubmit: (localPath: string, remotePath: string) => Promise<void>
}

const inputCls = 'w-full rounded-[10px] border border-[#e5e5e5] px-4 py-2.5 font-display text-[14px] outline-none focus:border-[#6366f1]'
const labelCls = 'mb-1.5 block font-display text-[13px] font-medium text-[#71717b]'

export default function AddSyncFolderDrawer({ open, onClose, onSubmit }: AddSyncFolderDrawerProps): JSX.Element {
  const [localPath, setLocalPath] = useState('')
  const [remotePath, setRemotePath] = useState('')
  const [showRemotePicker, setShowRemotePicker] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickLocal = async (): Promise<void> => {
    const path = await window.api.dialog.selectFolder()
    if (path) setLocalPath(path)
  }

  const handleSubmit = async (): Promise<void> => {
    if (!localPath.trim()) {
      setError('Select a local folder first')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const cloudPath = remotePath.trim() || `/${localPath.trim().split(/[/\\]/).filter(Boolean).pop() ?? 'Sync'}`
      await onSubmit(localPath.trim(), cloudPath)
      setLocalPath('')
      setRemotePath('')
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add sync folder')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DrawerPanel open={open} title="Add Sync Folder" onClose={onClose} widthClass="w-[480px]">
        <div className="flex flex-1 flex-col gap-5 px-6 py-5">
          <div>
            <label className={labelCls}>Local folder on this device</label>
            <div className="flex gap-2">
              <input className={inputCls} readOnly value={localPath} placeholder="No folder selected" />
              <button
                type="button"
                onClick={pickLocal}
                className="flex shrink-0 items-center gap-1.5 rounded-[10px] border border-[#e5e5e5] px-3 font-display text-[13px] font-semibold text-[#09090b] hover:bg-[#f8fafc]"
              >
                <FolderOpen className="h-4 w-4" /> Browse
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>Cloud folder to sync with</label>
            <div className="flex gap-2">
              <input
                className={inputCls}
                value={remotePath}
                onChange={(e) => setRemotePath(e.target.value)}
                placeholder="/Documents"
              />
              <button
                type="button"
                onClick={() => setShowRemotePicker(true)}
                className="shrink-0 rounded-[10px] border border-[#e5e5e5] px-3 font-display text-[13px] font-semibold text-[#2b7fff] hover:bg-[#f8fafc]"
              >
                Pick
              </button>
            </div>
            <p className="mt-1.5 font-display text-[12px] text-[#71717b]">
              Pick a dedicated cloud folder (e.g. /Documents). Leave blank to use a folder matching the local name.
            </p>
          </div>

          {error ? <p className="font-display text-[13px] text-[#ef4444]">{error}</p> : null}

          <div className="mt-auto flex flex-col gap-3 pb-6">
            <button
              type="button"
              disabled={busy || !localPath}
              onClick={handleSubmit}
              className="h-12 rounded-[10px] bg-gradient-to-r from-[#6366f1] to-[#2b7fff] font-display text-[15px] font-semibold text-white disabled:opacity-50"
            >
              {busy ? 'Starting sync…' : 'Start Syncing'}
            </button>
            <button type="button" onClick={onClose} className="h-12 rounded-[10px] border border-[#e5e5e5] font-display text-[15px] font-semibold text-[#71717b]">
              Cancel
            </button>
          </div>
        </div>
      </DrawerPanel>

      {showRemotePicker && (
        <MoveFolderDialog
          onCancel={() => setShowRemotePicker(false)}
          onSelect={(path) => {
            setRemotePath(path)
            setShowRemotePicker(false)
          }}
        />
      )}
    </>
  )
}
