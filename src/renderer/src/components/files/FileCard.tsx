import type { FileItem } from '../../types/files'
import FileContextMenu, { type FileAction } from './FileContextMenu'

const imgMynauiPinSolid = 'https://www.figma.com/api/mcp/asset/253789f1-6def-4d0a-89f2-3e80a186d82e'
const imgFrame1 = 'https://www.figma.com/api/mcp/asset/3fcada0b-0a40-4df0-a51a-4497feca8fbb'

interface FileCardProps {
  file: FileItem
  onAction?: (action: FileAction, file: FileItem) => void
  onToggleFavourite?: (file: FileItem) => void
  onDoubleClick?: (file: FileItem) => void
}

export default function FileCard({ file, onAction, onToggleFavourite, onDoubleClick }: FileCardProps): JSX.Element {
  const meta = file.sharedBy
    ? `Shared by ${file.sharedBy} • ${file.modifiedLabel}`
    : `${file.sizeLabel} • ${file.modifiedLabel}${file.shared ? ' • Shared' : ''}`

  return (
    <div
      className="group flex cursor-pointer flex-col gap-3 rounded-[16px] bg-white p-3 shadow-[0px_4px_6px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-md"
      onDoubleClick={() => onDoubleClick?.(file)}
    >
      <div className="relative h-[160px] w-full overflow-hidden rounded-[12px] bg-[#f5f5f7]">
        {file.thumbnail ? (
          <img alt="" className="h-full w-full object-cover" src={file.thumbnail} />
        ) : (
          <div className="flex h-full items-center justify-center text-[32px]">📁</div>
        )}
        {(file.pinned || file.favourite) && (
          <div className="absolute right-3 top-3 flex items-center gap-1">
            {file.pinned && (
              <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[rgba(255,255,255,0.8)] backdrop-blur-[2px]">
                <img alt="" className="h-4 w-4" src={imgMynauiPinSolid} />
              </div>
            )}
            {file.favourite && (
              <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[rgba(255,255,255,0.8)] backdrop-blur-[2px]">
                <img alt="" className="h-4 w-4" src={imgFrame1} />
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
