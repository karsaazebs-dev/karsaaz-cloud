import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import type { FileItem } from '../../types/files'

export type FileAction = 'download' | 'share' | 'rename' | 'move' | 'favourite' | 'copy-link' | 'delete'

interface FileContextMenuProps {
  file: FileItem
  onAction: (action: FileAction, file: FileItem) => void
  onToggleFavourite?: (file: FileItem) => void
}

export default function FileContextMenu({ file, onAction, onToggleFavourite }: FileContextMenuProps): JSX.Element {
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

  const items: { action: FileAction; label: string }[] = [
    { action: 'download', label: 'Download' },
    { action: 'share', label: 'Share' },
    { action: 'rename', label: 'Rename' },
    { action: 'move', label: 'Move' },
    { action: 'favourite', label: file.favourite ? 'Remove from Favourites' : 'Add to Favourites' },
    { action: 'copy-link', label: 'Copy Link' },
    { action: 'delete', label: 'Delete' }
  ]

  const handleClick = (action: FileAction): void => {
    if (action === 'favourite' && onToggleFavourite) onToggleFavourite(file)
    else onAction(action, file)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="flex h-[30px] w-[30px] items-center justify-center rounded-[6px] hover:bg-[#f3f4f6]"
      >
        <MoreHorizontal className="h-4 w-4 text-[#6b7280]" />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-50 mb-1 min-w-[180px] rounded-[8px] border border-[#e5e5e5] bg-white py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.action}
              onClick={(e) => { e.stopPropagation(); handleClick(item.action) }}
              className={`flex w-full px-4 py-2 text-left font-display text-[13px] hover:bg-[#f5f5f7] ${
                item.action === 'delete' ? 'text-[#ef4444]' : 'text-[#09090b]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
