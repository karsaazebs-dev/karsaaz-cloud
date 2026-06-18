import { useEffect, useMemo, useState } from 'react'
import MediaViewer from '../components/media/MediaViewer'
import { listFiles } from '../services/filesApi'
import type { FileItem } from '../types/files'

const TABS = ['All', 'Photos', 'Videos'] as const

export default function Media(): JSX.Element {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All')
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [allFiles, setAllFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listFiles('/')
      .then((files) => setAllFiles(files.filter((f) => f.type === 'image' || f.type === 'video')))
      .finally(() => setLoading(false))
  }, [])

  const mediaFiles = useMemo(() => {
    if (activeTab === 'Photos') return allFiles.filter((f) => f.type === 'image')
    if (activeTab === 'Videos') return allFiles.filter((f) => f.type === 'video')
    return allFiles
  }, [allFiles, activeTab])

  const grouped = useMemo(() => {
    const groups: Record<string, FileItem[]> = {}
    mediaFiles.forEach((f) => {
      const key = f.modifiedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      if (!groups[key]) groups[key] = []
      groups[key].push(f)
    })
    return groups
  }, [mediaFiles])

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[20px] font-bold text-[#09090b]">Media</h2>
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-[30px] px-4 py-2 font-display text-[13px] font-semibold ${
                activeTab === tab ? 'bg-[#2b7fff] text-white' : 'bg-white text-[#71717b] border border-[#e5e5e5]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2b7fff] border-t-transparent" />
        </div>
      ) : mediaFiles.length === 0 ? (
        <div className="rounded-[16px] bg-white py-12 text-center shadow-sm">
          <p className="font-display text-[15px] text-[#71717b]">No media files found</p>
        </div>
      ) : (
        Object.entries(grouped).map(([month, items]) => (
          <div key={month} className="flex flex-col gap-3">
            <button
              onClick={() => setCollapsed((p) => ({ ...p, [month]: !p[month] }))}
              className="flex items-center gap-2 font-display text-[14px] font-semibold text-[#09090b]"
            >
              <span className={`transition-transform ${collapsed[month] ? '' : 'rotate-90'}`}>▶</span>
              {month} ({items.length})
            </button>
            {!collapsed[month] && (
              <div className="grid grid-cols-5 gap-3">
                {items.map((f) => {
                  const idx = mediaFiles.indexOf(f)
                  return (
                    <button
                      key={f.id}
                      onClick={() => setViewerIndex(idx)}
                      className="aspect-square overflow-hidden rounded-[12px] bg-[#f5f5f7]"
                    >
                      {f.thumbnail ? (
                        <img alt={f.name} className="h-full w-full object-cover" src={f.thumbnail} />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl">
                          {f.type === 'video' ? '🎬' : '🖼️'}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))
      )}

      {viewerIndex !== null && (
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
