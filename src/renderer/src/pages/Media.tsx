import { useMemo, useState } from 'react'
import MediaViewer from '../components/media/MediaViewer'
import { MOCK_FILES } from '../data/mockFiles'
import type { FileItem } from '../types/files'

const TABS = ['All', 'Photos', 'Videos'] as const

export default function Media(): JSX.Element {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All')
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  const mediaFiles = useMemo(() => {
    const all = MOCK_FILES.filter((f) => f.type === 'image' || f.type === 'video')
    if (activeTab === 'Photos') return all.filter((f) => f.type === 'image')
    if (activeTab === 'Videos') return all.filter((f) => f.type === 'video')
    return all
  }, [activeTab])

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

      {Object.entries(grouped).map(([month, items]) => (
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
                      <div className="flex h-full items-center justify-center text-3xl">🎬</div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ))}

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
