import type { FileItem } from '../../types/files'
import FileContextMenu, { type FileAction } from './FileContextMenu'

const TYPE_ICONS: Record<string, string> = {
  folder: '📁',
  image: '🖼️',
  document: '📄',
  video: '🎬',
  other: '📎'
}

interface FileRowProps {
  file: FileItem
  onAction?: (action: FileAction, file: FileItem) => void
  onToggleFavourite?: (file: FileItem) => void
  onDoubleClick?: (file: FileItem) => void
}

export default function FileRow({ file, onAction, onToggleFavourite, onDoubleClick }: FileRowProps): JSX.Element {
  const typeLabel = file.type.charAt(0).toUpperCase() + file.type.slice(1)

  return (
    <div
      className="group flex h-[56px] cursor-pointer items-center gap-4 rounded-[10px] border border-transparent bg-white px-4 transition-colors hover:border-[#e5e5e5] hover:bg-[#fafafa]"
      onDoubleClick={() => onDoubleClick?.(file)}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#f5f5f7] text-lg">
        {file.thumbnail && file.type !== 'folder' ? (
          <img alt="" className="h-full w-full rounded-[8px] object-cover" src={file.thumbnail} />
        ) : (
          <span>{TYPE_ICONS[file.type] ?? '📎'}</span>
        )}
      </div>
      <p className="min-w-[180px] flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-display text-[13px] font-semibold text-[#09090b]">
        {file.name}
      </p>
      <p className="w-24 font-display text-[12px] text-[#71717b]">{typeLabel}</p>
      <p className="w-20 font-display text-[12px] text-[#71717b]">{file.sizeLabel}</p>
      <p className="w-28 font-display text-[12px] text-[#71717b]">{file.modifiedLabel}</p>
      {file.shared && (
        <span className="rounded-[6px] bg-[#eff6ff] px-2 py-0.5 font-display text-[11px] font-medium text-[#2b7fff]">
          {file.sharedBy ? `by ${file.sharedBy}` : 'Shared'}
        </span>
      )}
      {file.favourite && <span className="text-sm">⭐</span>}
      <div className="w-8 opacity-0 transition-opacity group-hover:opacity-100">
        <FileContextMenu
          file={file}
          onAction={onAction ?? (() => {})}
          onToggleFavourite={onToggleFavourite}
        />
      </div>
    </div>
  )
}
