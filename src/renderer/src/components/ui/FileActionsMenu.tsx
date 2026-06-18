import { useEffect, useRef, useState } from 'react'
import {
  MoreHorizontal, Pencil, Star, Info, Type, Tag, Download,
  Share2, RefreshCw, FolderInput, Pin, Trash2
} from 'lucide-react'
import type { FileItem } from '../../types/files'
import type { FileAction } from '../../types/fileActions'
import { FILE_ACTION_MENU_ITEMS } from '../../types/fileActions'

const ICONS: Record<FileAction, typeof Pencil> = {
  edit: Pencil,
  favourite: Star,
  details: Info,
  rename: Type,
  tag: Tag,
  export: Download,
  share: Share2,
  sync: RefreshCw,
  move: FolderInput,
  pin: Pin,
  delete: Trash2
}

interface FileActionsMenuProps {
  file: FileItem
  onAction: (action: FileAction, file: FileItem) => void
}

export default function FileActionsMenu({ file, onAction }: FileActionsMenuProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const items = FILE_ACTION_MENU_ITEMS.filter((item) => !(file.isFolder && item.folderHidden))

  const handleClick = (action: FileAction): void => {
    onAction(action, file)
    setOpen(false)
  }

  const favouriteLabel = file.favourite ? 'Remove from favourite' : 'Add to favourite'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="File actions"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="flex h-[30px] w-[30px] items-center justify-center rounded-[6px] hover:bg-[#f3f4f6]"
      >
        <MoreHorizontal className="h-4 w-4 text-[#6b7280]" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-[10px] border border-[#e5e7eb] bg-white py-1.5 shadow-[0px_8px_24px_rgba(0,0,0,0.12)]">
          {items.map((item) => {
            const Icon = ICONS[item.action]
            const label = item.action === 'favourite' ? favouriteLabel : item.label
            return (
              <button
                key={item.action}
                type="button"
                onClick={(e) => { e.stopPropagation(); handleClick(item.action) }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left font-display text-[14px] transition-colors hover:bg-[#f5f5f7] ${
                  item.destructive ? 'text-[#dc2626]' : 'text-[#09090b]'
                }`}
              >
                <Icon className={`h-[18px] w-[18px] shrink-0 ${item.destructive ? 'text-[#dc2626]' : 'text-[#6b7280]'}`} />
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export type { FileAction }
