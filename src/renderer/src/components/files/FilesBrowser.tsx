import { useCallback, useState, type DragEvent, type ReactNode } from 'react'
import { useUpload } from '../../hooks/useUpload'
import FilterTabs from './FilterTabs'
import FileCard from './FileCard'
import FileRow from './FileRow'
import FileViewToolbar from './FileViewToolbar'
import EmptyState from './EmptyState'
import { useFileView } from '../../hooks/useFileView'
import type { FileItem } from '../../types/files'
import type { FileAction } from './FileContextMenu'
import { getTabCounts } from '../../data/mockFiles'

interface FilesBrowserProps {
  title: string
  files: FileItem[]
  breadcrumbs?: { label: string; onClick?: () => void }[]
  showFilters?: boolean
  onFolderOpen?: (file: FileItem) => void
  emptyMessage?: string
  emptyCta?: string
  onEmptyCta?: () => void
  headerExtra?: ReactNode
}

export default function FilesBrowser({
  title,
  files,
  breadcrumbs,
  showFilters = true,
  onFolderOpen,
  emptyMessage = 'No files found',
  emptyCta,
  onEmptyCta,
  headerExtra
}: FilesBrowserProps): JSX.Element {
  const {
    activeTab, setActiveTab, viewGrid, setViewGrid,
    sort, setSort, sortOpen, setSortOpen,
    displayFiles, toggleFavourite
  } = useFileView(files)
  const { addFiles } = useUpload()
  const [dragOver, setDragOver] = useState(false)

  const counts = getTabCounts(files)

  const handleAction = useCallback((action: FileAction, file: FileItem) => {
    if (action === 'delete') console.log('Delete', file.name)
    if (action === 'download') console.log('Download', file.name)
    if (action === 'share') console.log('Share', file.name)
  }, [])

  const handleDoubleClick = (file: FileItem): void => {
    if (file.isFolder && onFolderOpen) onFolderOpen(file)
  }

  const onDragOver = (e: DragEvent): void => {
    e.preventDefault()
    setDragOver(true)
  }

  const onDragLeave = (): void => setDragOver(false)

  const onDrop = (e: DragEvent): void => {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files)
    if (dropped.length) addFiles(dropped)
  }

  return (
    <div
      className={`relative flex flex-col gap-6 ${dragOver ? 'rounded-[16px] ring-2 ring-[#2b7fff] ring-offset-2' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[16px] bg-[rgba(43,127,255,0.08)]">
          <p className="font-display text-[16px] font-semibold text-[#2b7fff]">Drop files to upload</p>
        </div>
      )}

      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 font-display text-[13px] text-[#71717b]">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.label} className="flex items-center gap-2">
              {i > 0 && <span>/</span>}
              {crumb.onClick ? (
                <button onClick={crumb.onClick} className="hover:text-[#2b7fff]">{crumb.label}</button>
              ) : (
                <span className="font-semibold text-[#09090b]">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <p className="font-display text-[20px] font-bold text-[#09090b]">{title}</p>
            <p className="font-display text-[14px] text-[#71717b]">({displayFiles.length})</p>
          </div>
          {showFilters && <FilterTabs activeTab={activeTab} counts={counts} onChange={setActiveTab} />}
        </div>
        <div className="flex items-center gap-3">
          {headerExtra}
          <FileViewToolbar
            viewGrid={viewGrid}
            onViewChange={setViewGrid}
            sort={sort}
            onSortChange={setSort}
            sortOpen={sortOpen}
            onSortOpenChange={setSortOpen}
          />
        </div>
      </div>

      {displayFiles.length === 0 ? (
        <EmptyState message={emptyMessage} cta={emptyCta} onCta={onEmptyCta} />
      ) : viewGrid ? (
        <div className="grid grid-cols-4 gap-6">
          {displayFiles.map((f) => (
            <FileCard
              key={f.id}
              file={f}
              onAction={handleAction}
              onToggleFavourite={(file) => toggleFavourite(file.id)}
              onDoubleClick={handleDoubleClick}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex h-10 items-center gap-4 px-4 font-display text-[11px] font-semibold uppercase tracking-wide text-[#71717b]">
            <span className="w-9" />
            <span className="min-w-[180px] flex-1">Name</span>
            <span className="w-24">Type</span>
            <span className="w-20">Size</span>
            <span className="w-28">Modified</span>
            <span className="w-24">Status</span>
            <span className="w-8" />
          </div>
          {displayFiles.map((f) => (
            <FileRow
              key={f.id}
              file={f}
              onAction={handleAction}
              onToggleFavourite={(file) => toggleFavourite(file.id)}
              onDoubleClick={handleDoubleClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
