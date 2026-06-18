import { useCallback, useEffect, useState } from 'react'
import { ChevronRight, Folder, FolderPlus } from 'lucide-react'
import { listFiles, createFolder } from '../../services/filesApi'
import { davHrefToUserPath } from '../../utils/davPaths'
import { getUsername } from '../../services/nextcloud'

interface MoveFolderDialogProps {
  excludePath?: string
  onSelect: (path: string) => void
  onCancel: () => void
}

export default function MoveFolderDialog({ excludePath, onSelect, onCancel }: MoveFolderDialogProps): JSX.Element {
  const [currentPath, setCurrentPath] = useState('/')
  const [folders, setFolders] = useState<Array<{ name: string; path: string }>>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const loadFolders = useCallback(async (path: string) => {
    setLoading(true)
    try {
      const username = await getUsername()
      const items = await listFiles(path)
      const dirs = items
        .filter((f) => f.isFolder)
        .map((f) => ({
          name: f.name,
          path: davHrefToUserPath(f.path, username)
        }))
        .filter((f) => f.path !== excludePath)
        .sort((a, b) => a.name.localeCompare(b.name))
      setFolders(dirs)
    } finally {
      setLoading(false)
    }
  }, [excludePath])

  useEffect(() => {
    loadFolders(currentPath)
  }, [currentPath, loadFolders])

  const crumbs = currentPath === '/' ? [] : currentPath.split('/').filter(Boolean)

  const handleCreate = async (): Promise<void> => {
    const name = newName.trim()
    if (!name) return
    const path = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`
    try {
      await createFolder(path)
      setNewName('')
      setCreating(false)
      await loadFolders(currentPath)
    } catch {
      alert('Could not create folder')
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="flex w-full max-w-lg flex-col rounded-[16px] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#e5e5e5] px-6 py-4">
          <h3 className="font-display text-[18px] font-bold text-[#09090b]">Move to folder</h3>
          <nav className="mt-2 flex flex-wrap items-center gap-1 font-display text-[12px] text-[#71717b]">
            <button type="button" onClick={() => setCurrentPath('/')} className="hover:text-[#2b7fff]">Home</button>
            {crumbs.map((part, i) => {
              const path = '/' + crumbs.slice(0, i + 1).join('/')
              return (
                <span key={path} className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3" />
                  <button type="button" onClick={() => setCurrentPath(path)} className="hover:text-[#2b7fff]">{part}</button>
                </span>
              )
            })}
          </nav>
        </div>

        <div className="max-h-[320px] overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2b7fff] border-t-transparent" />
            </div>
          ) : folders.length === 0 ? (
            <p className="py-8 text-center font-display text-[13px] text-[#71717b]">No subfolders here</p>
          ) : (
            folders.map((folder) => (
              <button
                key={folder.path}
                type="button"
                onClick={() => setCurrentPath(folder.path)}
                className="flex w-full items-center gap-3 rounded-[8px] px-4 py-2.5 text-left hover:bg-[#f5f5f7]"
              >
                <Folder className="h-5 w-5 shrink-0 text-[#2b7fff]" />
                <span className="font-display text-[14px] text-[#09090b]">{folder.name}</span>
                <ChevronRight className="ml-auto h-4 w-4 text-[#9ca3af]" />
              </button>
            ))
          )}
        </div>

        {creating ? (
          <div className="flex items-center gap-2 border-t border-[#e5e5e5] px-6 py-3">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New folder name"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
              className="flex-1 rounded-[8px] border border-[#e5e5e5] px-3 py-2 font-display text-[13px] outline-none focus:border-[#2b7fff]"
            />
            <button type="button" onClick={handleCreate} className="rounded-[8px] bg-[#2b7fff] px-3 py-2 font-display text-[12px] font-semibold text-white">Create</button>
            <button type="button" onClick={() => { setCreating(false); setNewName('') }} className="font-display text-[12px] text-[#71717b]">Cancel</button>
          </div>
        ) : (
          <div className="flex items-center justify-between border-t border-[#e5e5e5] px-6 py-4">
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-[#2b7fff] hover:opacity-80"
            >
              <FolderPlus className="h-4 w-4" />
              New folder
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onCancel} className="rounded-[8px] px-4 py-2 font-display text-[13px] font-semibold text-[#71717b] hover:bg-[#f3f4f6]">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onSelect(currentPath)}
                className="rounded-[8px] bg-[#2b7fff] px-4 py-2 font-display text-[13px] font-semibold text-white hover:opacity-90"
              >
                Move here
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
