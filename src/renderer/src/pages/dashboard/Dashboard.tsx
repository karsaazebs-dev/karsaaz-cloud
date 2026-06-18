import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HardDrive, Database, Files, Share2, ChevronDown, LayoutGrid, List, Pin, MoreHorizontal
} from 'lucide-react'
import { getQuota, getStorageBreakdown } from '../../services/storageApi'
import { listFiles } from '../../services/filesApi'
import { testConnection } from '../../services/nextcloud'
import type { FileItem } from '../../types/files'
import type { StorageStats, StorageBreakdown } from '../../services/storageApi'

const FALLBACK_STORAGE_TYPES = [
  { label: 'Images', label_size: '—', percentage: 25, color: '#0d9488' },
  { label: 'Documents', label_size: '—', percentage: 25, color: '#2b7fff' },
  { label: 'Videos', label_size: '—', percentage: 25, color: '#8b5cf6' },
  { label: 'Others', label_size: '—', percentage: 25, color: '#71717b' },
]

const TAB_COLORS = ['#2b7fff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
const TAB_TYPES = ['All Files', 'Photos', 'Documents', 'Videos', 'Others']

export default function Dashboard(): JSX.Element {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)
  const [viewGrid, setViewGrid] = useState(true)
  const [quota, setQuota] = useState<StorageStats | null>(null)
  const [breakdown, setBreakdown] = useState<StorageBreakdown[]>(FALLBACK_STORAGE_TYPES.map(f => ({ ...f, bytes: 0 })))
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([])
  const [connError, setConnError] = useState('')

  useEffect(() => {
    testConnection().then((result) => {
      if (!result.ok) {
        setConnError(result.error ?? 'Not connected')
        return
      }
      setConnError('')
      getQuota().then(setQuota)
      getStorageBreakdown().then(setBreakdown)
      listFiles('/').then((files) => {
        const sorted = [...files].sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
        setRecentFiles(sorted.slice(0, 8))
      })
    })
  }, [])

  const usedLabel = quota?.usedLabel ?? '—'
  const totalLabel = quota?.totalLabel ?? '—'
  const freeLabel = quota?.freeLabel ?? '—'

  const totalUsed = quota?.used ?? 0
  const totalStorage = quota?.total ?? 1

  const STATS = [
    { label: 'Total Storage Used', Icon: HardDrive, value: usedLabel, sub: `of ${totalLabel}` },
    { label: 'Free Space', Icon: Database, value: freeLabel, sub: `of ${totalLabel} available` },
    { label: 'Files', Icon: Files, value: String(recentFiles.length), sub: 'in root folder' },
    { label: 'Shared with You', Icon: Share2, value: String(recentFiles.filter(f => f.sharedBy).length), sub: 'files shared with you' },
  ]

  const filteredFiles = recentFiles.filter((f) => {
    if (activeTab === 1) return f.type === 'image'
    if (activeTab === 2) return f.type === 'document'
    if (activeTab === 3) return f.type === 'video'
    if (activeTab === 4) return f.type === 'other'
    return true
  })

  const circumference = 2 * Math.PI * 52
  let offset = 0
  const donutSegments = breakdown.map((t) => {
    const pct = t.percentage / 100
    const seg = { color: t.color, dash: pct * circumference, offset }
    offset += pct * circumference
    return seg
  })

  if (connError) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24">
        <div className="flex flex-col items-center gap-4 rounded-[20px] bg-white p-10 shadow-sm text-center max-w-md">
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
      {/* Stats row */}
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
              <p className="font-display text-[12px] font-normal text-[#71717b]">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown row */}
      <div className="flex gap-6">
        {/* Donut card */}
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

        {/* Storage usage card */}
        <div className="flex flex-1 flex-col gap-8 rounded-[16px] bg-white p-6 shadow-[0px_4px_6px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <p className="font-display text-[16px] font-bold text-[#09090b]">Storage Usage</p>
            <p className="font-display text-[13px] font-semibold text-[#2b7fff]">{usedLabel} of {totalLabel}</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="h-4 w-full overflow-hidden rounded-full bg-[#f0f0f5]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#2b7fff] to-[#0d9488] transition-all"
                style={{ width: `${Math.min(100, (totalUsed / totalStorage) * 100).toFixed(1)}%` }}
              />
            </div>
            <div className="flex justify-between">
              <span className="font-display text-[12px] text-[#71717b]">Used: {usedLabel}</span>
              <span className="font-display text-[12px] text-[#71717b]">Free: {freeLabel}</span>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {breakdown.map((t) => (
                <div key={t.label} className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="font-display text-[12px] font-medium text-[#09090b]">{t.label}</span>
                    <span className="font-display text-[12px] text-[#71717b]">{t.label_size} · {t.percentage}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0f0f5]">
                    <div className="h-full rounded-full" style={{ width: `${t.percentage}%`, background: t.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* File grid header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <p className="font-display text-[20px] font-bold text-[#09090b]">My Files</p>
            <p className="font-display text-[14px] text-[#71717b]">({filteredFiles.length})</p>
          </div>
          <div className="flex gap-[3px]">
            {TAB_TYPES.map((label, i) => (
              <button
                key={label}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2.5 rounded-[30px] border px-4 py-2.5 transition-all ${
                  activeTab === i
                    ? 'border-[#2b7fff] bg-[#2b7fff] shadow-[0px_4px_4px_rgba(43,127,255,0.3)]'
                    : 'border-[#e5e5e5] bg-white'
                }`}
              >
                <div className="h-2 w-2 rounded-full" style={{ background: activeTab === i ? 'rgba(255,255,255,0.8)' : TAB_COLORS[i] }} />
                <span className={`font-display text-[14px] font-semibold ${activeTab === i ? 'text-white' : 'text-[#09090b]'}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <button className="flex items-center gap-2 rounded-[8px] border border-[#e5e5e5] bg-white px-3 py-2">
            <span className="font-display text-[13px] font-semibold text-black">Newest First</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#6b7280]" />
          </button>
          {/* View toggle */}
          <div className="flex gap-1 rounded-[8px] bg-[#e5e5e5] p-1">
            <button
              onClick={() => setViewGrid(true)}
              className={`flex items-center justify-center rounded-[4px] p-1.5 ${viewGrid ? 'bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.1)]' : ''}`}
            >
              <LayoutGrid className="h-4 w-4 text-[#6b7280]" />
            </button>
            <button
              onClick={() => setViewGrid(false)}
              className={`flex items-center justify-center rounded-[4px] p-1.5 ${!viewGrid ? 'bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.1)]' : ''}`}
            >
              <List className="h-4 w-4 text-[#6b7280]" />
            </button>
          </div>
        </div>
      </div>

      {/* File grid */}
      {filteredFiles.length === 0 ? (
        <div className="rounded-[16px] bg-white py-12 text-center shadow-sm">
          <p className="font-display text-[15px] text-[#71717b]">No files yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-6">
          {filteredFiles.map((f) => (
            <div key={f.id} className="flex flex-col gap-3 rounded-[16px] bg-white p-3 shadow-[0px_4px_6px_rgba(0,0,0,0.03)]">
              <div className="relative h-[160px] w-full overflow-hidden rounded-[12px] bg-[#f5f5f7]">
                {f.thumbnail ? (
                  <img alt="" className="h-full w-full object-cover" src={f.thumbnail} />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl">
                    {f.isFolder ? '📁' : f.type === 'image' ? '🖼️' : f.type === 'video' ? '🎬' : f.type === 'document' ? '📄' : '📎'}
                  </div>
                )}
                {f.favourite && (
                  <div className="absolute right-3 top-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[rgba(255,255,255,0.8)] backdrop-blur-[2px]">
                      <Pin className="h-4 w-4 text-[#2b7fff]" />
                    </div>
                  </div>
                )}
              </div>
              <div className="relative flex flex-col gap-0.5">
                <p className="overflow-hidden text-ellipsis whitespace-nowrap font-display text-[12px] font-semibold text-[#09090b]">
                  {f.name}
                </p>
                <p className="font-display text-[11px] text-[#71717b]">
                  {f.sizeLabel !== '—' ? `${f.sizeLabel} • ` : ''}{f.modifiedLabel}
                  {f.sharedBy ? ` • Shared by ${f.sharedBy}` : ''}
                </p>
                <button className="absolute bottom-0 right-0 flex h-[30px] w-[30px] rotate-90 items-center justify-center">
                  <MoreHorizontal className="h-4 w-4 text-[#6b7280]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
