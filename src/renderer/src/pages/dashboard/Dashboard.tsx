import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HardDrive, Database, Share2, Clock, FolderOpen } from 'lucide-react'
import { getQuota } from '../../services/storageApi'
import { listFiles, listSharedWithMe } from '../../services/filesApi'
import { testConnection } from '../../services/nextcloud'
import { getTabCounts } from '../../data/mockFiles'
import { useFileView } from '../../hooks/useFileView'
import { useSearch, filterFilesByQuery } from '../../hooks/useSearch'
import { useFileActions } from '../../hooks/useFileActions'
import { computeBreakdownFromFiles, computeUploadActivity, getLastUploaded } from '../../utils/fileStats'
import FilterTabs from '../../components/files/FilterTabs'
import FileViewToolbar from '../../components/files/FileViewToolbar'
import FileCard from '../../components/files/FileCard'
import FileRow from '../../components/files/FileRow'
import MediaViewer from '../../components/media/MediaViewer'
import FileDetailsModal from '../../components/files/FileDetailsModal'
import UploadActivityChart from '../../components/dashboard/UploadActivityChart'
import type { FileItem } from '../../types/files'
import type { StorageStats } from '../../services/storageApi'

export default function Dashboard(): JSX.Element {
  const navigate = useNavigate()
  const { query: searchQuery } = useSearch()
  const [quota, setQuota] = useState<StorageStats | null>(null)
  const [allFiles, setAllFiles] = useState<FileItem[]>([])
  const [sharedCount, setSharedCount] = useState(0)
  const [connError, setConnError] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [detailsFile, setDetailsFile] = useState<FileItem | null>(null)

  const reload = useCallback(async () => {
    const [files, shares] = await Promise.all([listFiles('/'), listSharedWithMe()])
    setAllFiles(files)
    setSharedCount(shares.length)
  }, [])

  useEffect(() => {
    testConnection().then(async (result) => {
      if (!result.ok) {
        setConnError(result.error ?? 'Not connected')
        setLoading(false)
        return
      }
      setConnError('')
      const q = await getQuota()
      setQuota(q)
      await reload()
      setLoading(false)
    })
  }, [reload])

  const searchedFiles = useMemo(
    () => filterFilesByQuery(allFiles, searchQuery),
    [allFiles, searchQuery]
  )

  const {
    activeTab, setActiveTab, viewGrid, setViewGrid,
    sort, setSort, sortOpen, setSortOpen,
    displayFiles
  } = useFileView(searchedFiles)

  const handleFileAction = useFileActions(reload, setDetailsFile)

  const breakdown = useMemo(() => computeBreakdownFromFiles(allFiles), [allFiles])
  const uploadActivity = useMemo(() => computeUploadActivity(allFiles), [allFiles])
  const lastUploaded = useMemo(() => getLastUploaded(allFiles), [allFiles])
  const tabCounts = useMemo(() => getTabCounts(searchedFiles), [searchedFiles])

  const mediaFiles = useMemo(
    () => displayFiles.filter((f) => !f.isFolder && (f.type === 'image' || f.type === 'video')),
    [displayFiles]
  )

  const handleFolderOpen = (file: FileItem): void => {
    if (file.isFolder) navigate('/app/files/all')
  }

  const handleFileClick = (file: FileItem): void => {
    if (file.isFolder) return
    if (file.type === 'image' || file.type === 'video') {
      const idx = mediaFiles.findIndex((f) => f.id === file.id)
      if (idx >= 0) setViewerIndex(idx)
    }
  }

  const usedLabel = quota?.usedLabel ?? '—'
  const totalLabel = quota?.totalLabel ?? '—'
  const freeLabel = quota?.freeLabel ?? '—'

  const circumference = 2 * Math.PI * 52
  let offset = 0
  const donutSegments = breakdown.map((t) => {
    const pct = t.percentage / 100
    const seg = { color: t.color, dash: pct * circumference, offset }
    offset += pct * circumference
    return seg
  })

  const STATS = [
    { label: 'Total Storage Used', Icon: HardDrive, value: usedLabel, sub: `of ${totalLabel}` },
    { label: 'Free Space', Icon: Database, value: freeLabel, sub: `of ${totalLabel} available` },
    {
      label: 'Last Uploaded',
      Icon: Clock,
      value: lastUploaded?.modifiedLabel ?? '—',
      sub: lastUploaded ? `${lastUploaded.name} · ${lastUploaded.sizeLabel}` : 'No uploads yet'
    },
    { label: 'Shared with You', Icon: Share2, value: String(sharedCount), sub: 'files shared with you' }
  ]

  if (connError) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-[20px] bg-white p-10 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fee2e2]">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-display text-[18px] font-bold text-[#09090b]">Not connected to server</p>
            <p className="font-display text-[14px] text-[#71717b]">{connError}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/auth/login')}
              className="rounded-[10px] bg-[#2b7fff] px-6 py-2.5 font-display text-[14px] font-semibold text-white hover:opacity-90"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/auth/connect')}
              className="rounded-[10px] border border-[#e5e5e5] bg-white px-6 py-2.5 font-display text-[14px] font-semibold text-[#09090b] hover:shadow-sm"
            >
              Change Server
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <nav className="flex items-center gap-2 font-display text-[13px] text-[#71717b]">
        <span className="font-semibold text-[#09090b]">Dashboard</span>
        <span>/</span>
        <span>My Files</span>
      </nav>

      <div className="grid grid-cols-4 gap-6">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col gap-4 rounded-[16px] bg-white p-6 shadow-[0px_4px_6px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <p className="font-display text-[14px] font-medium text-[#71717b]">{s.label}</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[rgba(13,148,136,0.1)]">
                <s.Icon className="h-[22px] w-[22px] text-[#0d9488]" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-display text-[28px] font-bold text-[#09090b]">{s.value}</p>
              <p className="line-clamp-2 font-display text-[12px] font-normal text-[#71717b]">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        <div className="flex w-[400px] shrink-0 flex-col gap-6 rounded-[16px] bg-white p-6 shadow-[0px_4px_6px_rgba(0,0,0,0.03)]">
          <p className="font-display text-[16px] font-bold text-[#09090b]">Storage by Type</p>
          <div className="flex h-[180px] items-center justify-center">
            <div className="relative flex h-[140px] w-[140px] items-center justify-center">
              <svg viewBox="0 0 140 140" className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="70" cy="70" r="52" fill="none" stroke="#e5e5e5" strokeWidth="16" />
                {donutSegments.map((seg, i) => (
                  <circle key={i} cx="70" cy="70" r="52" fill="none" stroke={seg.color} strokeWidth="16"
                    strokeDasharray={`${seg.dash} ${circumference}`}
                    strokeDashoffset={`-${seg.offset}`} />
                ))}
              </svg>
              <div className="flex flex-col items-center gap-0.5">
                <p className="font-display text-[20px] font-bold text-black">{usedLabel}</p>
                <p className="font-display text-[11px] font-normal text-[#71717b]">Used</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {breakdown.map((t) => (
              <div key={t.label} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: t.color }} />
                <p className="flex-1 font-display text-[13px] font-medium text-[#09090b]">{t.label}</p>
                <p className="font-display text-[13px] text-[#71717b]">{t.label_size}</p>
                <p className="w-10 text-right font-display text-[13px] font-semibold text-[#09090b]">{t.percentage}%</p>
              </div>
            ))}
          </div>
        </div>

        <UploadActivityChart data={uploadActivity} />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-6 w-6 text-[#2b7fff]" />
          <p className="font-display text-[20px] font-bold text-[#09090b]">My Files</p>
          <p className="font-display text-[14px] text-[#71717b]">({displayFiles.length})</p>
          {searchQuery.trim() && (
            <span className="rounded-[6px] bg-[#eff6ff] px-2 py-0.5 font-display text-[12px] text-[#2b7fff]">
              Search: &quot;{searchQuery.trim()}&quot;
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <FilterTabs activeTab={activeTab} counts={tabCounts} onChange={setActiveTab} />
          <FileViewToolbar
            viewGrid={viewGrid}
            onViewChange={setViewGrid}
            sort={sort}
            onSortChange={setSort}
            sortOpen={sortOpen}
            onSortOpenChange={setSortOpen}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#2b7fff] border-t-transparent" />
          </div>
        ) : displayFiles.length === 0 ? (
          <div className="rounded-[16px] bg-white py-12 text-center shadow-sm">
            <p className="font-display text-[15px] text-[#71717b]">
              {searchQuery.trim() ? 'No files match your search' : 'No files in this category'}
            </p>
          </div>
        ) : viewGrid ? (
          <div className="grid grid-cols-4 gap-6">
            {displayFiles.map((f) => (
              <FileCard
                key={f.id}
                file={f}
                onAction={handleFileAction}
                onDoubleClick={handleFolderOpen}
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
              <span className="w-8" />
            </div>
            {displayFiles.map((f) => (
              <FileRow
                key={f.id}
                file={f}
                onAction={handleFileAction}
                onDoubleClick={handleFolderOpen}
                onClick={handleFileClick}
              />
            ))}
          </div>
        )}
      </div>

      {detailsFile && (
        <FileDetailsModal file={detailsFile} onClose={() => setDetailsFile(null)} />
      )}

      {viewerIndex !== null && mediaFiles.length > 0 && (
        <MediaViewer
          files={mediaFiles}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}
    </div>
  )
}
