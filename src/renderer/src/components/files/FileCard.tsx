import { Pin, Star } from 'lucide-react'
import type { FileItem } from '../../types/files'
import FileContextMenu, { type FileAction } from './FileContextMenu'

const TYPE_ICON: Record<string, string> = {
  image: '🖼️',
  video: '🎬',
  document: '📄',
  audio: '🎵',
  archive: '📦',
  other: '📎'
}

interface FileCardProps {
  file: FileItem
  onAction?: (action: FileAction, file: FileItem) => void
  onToggleFavourite?: (file: FileItem) => void
  onDoubleClick?: (file: FileItem) => void
  onClick?: (file: FileItem) => void
}

export default function FileCard({ file, onAction, onToggleFavourite, onDoubleClick, onClick }: FileCardProps): JSX.Element {
  const meta = file.sharedBy
    ? `Shared by ${file.sharedBy} • ${file.modifiedLabel}`
    : `${file.sizeLabel} • ${file.modifiedLabel}${file.shared ? ' • Shared' : ''}`

  const handleClick = (): void => {
    if (!file.isFolder) onClick?.(file)
  }

  return (
    <div
      className="group flex cursor-pointer flex-col gap-3 rounded-[16px] bg-white p-3 shadow-[0px_4px_6px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-md"
      onClick={handleClick}
      onDoubleClick={() => onDoubleClick?.(file)}
    >
      <div className="relative h-[160px] w-full overflow-hidden rounded-[12px] bg-[#f5f5f7]">
        {file.thumbnail ? (
          <img alt="" className="h-full w-full object-cover" src={file.thumbnail} />
        ) : (
          <div className="flex h-full items-center justify-center text-[32px]">
            {file.isFolder ? '📁' : (TYPE_ICON[file.type] ?? '📎')}
          </div>
        )}
        {(file.pinned || file.favourite) && (
          <div className="absolute right-3 top-3 flex items-center gap-1">
            {file.pinned && (
              <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[rgba(255,255,255,0.8)] backdrop-blur-[2px]">
                <Pin className="h-4 w-4 text-[#2b7fff]" />
              </div>
            )}
            {file.favourite && (
              <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[rgba(255,255,255,0.8)] backdrop-blur-[2px]">
                <Star className="h-4 w-4 text-[#f59e0b]" />
              </div>
            )}
          </div>
        )}
      </div>
      <div className="relative flex flex-col gap-0.5">
        <p className="overflow-hidden text-ellipsis whitespace-nowrap font-display text-[12px] font-semibold text-[#09090b]">
          {file.name}
        </p>
        <p className="pr-8 font-display text-[11px] text-[#71717b]">{meta}</p>
        <div className="absolute bottom-0 right-0 opacity-0 transition-opacity group-hover:opacity-100">
          <FileContextMenu
            file={file}
            onAction={onAction ?? (() => {})}
            onToggleFavourite={onToggleFavourite}
          />
        </div>
      </div>
    </div>
  )
}
