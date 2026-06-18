import { useCallback, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { useUpload } from '../../hooks/useUpload'
import { useFileActions } from '../../hooks/useFileActions'
import FilterTabs from './FilterTabs'
import FileCard from './FileCard'
import FileRow from './FileRow'
import FileViewToolbar from './FileViewToolbar'
import EmptyState from './EmptyState'
import FilePreview from './FilePreview'
import FileDetailsModal from './FileDetailsModal'
import NewFileMenu from './NewFileMenu'
import { useFileView } from '../../hooks/useFileView'
import type { FileItem } from '../../types/files'
import type { FileAction } from '../../types/fileActions'
import { getTabCounts } from '../../data/mockFiles'

interface FilesBrowserProps {
  title: string
  files: FileItem[]
  breadcrumbs?: { label: string; onClick?: () => void }[]
  showFilters?: boolean
  onFolderOpen?: (file: FileItem) => void
  onFileAction?: (action: FileAction, file: FileItem) => Promise<void>
  onRefresh?: () => void
  onCreateFolder?: () => Promise<void>
  currentPath?: string
  loading?: boolean
  error?: string
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
  onFileAction,
  onRefresh,
  onCreateFolder,
  currentPath = '/',
  loading = false,
  error = '',
  emptyMessage = 'No files found',
  emptyCta,
  onEmptyCta,
  headerExtra
}: FilesBrowserProps): JSX.Element {
  const {
    activeTab, setActiveTab, viewGrid, setViewGrid,
    sort, setSort, sortOpen, setSortOpen,
    displayFiles
  } = useFileView(files)
  const { addFiles } = useUpload()
  const [dragOver, setDragOver] = useState(false)
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [detailsFile, setDetailsFile] = useState<FileItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const defaultFileAction = useFileActions(onRefresh, setDetailsFile)

  const handleUploadClick = (): void => { fileInputRef.current?.click() }
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const picked = Array.from(e.target.files ?? [])
    if (picked.length) addFiles(picked, currentPath)
    e.target.value = ''
  }

  const counts = getTabCounts(files)

  const handleAction = useCallback(async (action: FileAction, file: FileItem) => {
    if (onFileAction) await onFileAction(action, file)
    else await defaultFileAction(action, file)
  }, [onFileAction, defaultFileAction])

  const handleDoubleClick = (file: FileItem): void => {
    if (file.isFolder && onFolderOpen) onFolderOpen(file)
  }

  const handleFileClick = (file: FileItem): void => {
    if (!file.isFolder) setPreviewFile(file)
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
    if (dropped.length) addFiles(dropped, currentPath)
  }

  if (error) {
    return (
      <div className="rounded-[16px] bg-white py-12 text-center shadow-sm">
        <p className="font-display text-[15px] text-[#ef4444]">{error}</p>
      </div>
    )
  }

  return (
    <>
    {previewFile && <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />}
    {detailsFile && <FileDetailsModal file={detailsFile} onClose={() => setDetailsFile(null)} />}
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
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2b7fff] border-t-transparent" />
            ) : (
              <p className="font-display text-[14px] text-[#71717b]">({displayFiles.length})</p>
            )}
          </div>
          {showFilters && <FilterTabs activeTab={activeTab} counts={counts} onChange={setActiveTab} />}
        </div>
        <div className="flex items-center gap-3">
          {headerExtra}
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInputChange} />
          <NewFileMenu onUploadFiles={handleUploadClick} onCreateFolder={onCreateFolder} />
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

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#2b7fff] border-t-transparent" />
        </div>
      ) : displayFiles.length === 0 ? (
        <EmptyState message={emptyMessage} cta={emptyCta} onCta={onEmptyCta} />
      ) : viewGrid ? (
        <div className="grid grid-cols-4 gap-6">
          {displayFiles.map((f) => (
            <FileCard
              key={f.id}
              file={f}
              onAction={handleAction}
              onDoubleClick={handleDoubleClick}
              onClick={handleFileClick}
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
            <span className="w-14" />
            <span className="w-8" />
          </div>
          {displayFiles.map((f) => (
            <FileRow
              key={f.id}
              file={f}
              onAction={handleAction}
              onDoubleClick={handleDoubleClick}
              onClick={handleFileClick}
            />
          ))}
        </div>
      )}
    </div>
    </>
  )
}
