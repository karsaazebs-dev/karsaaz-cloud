import { useState } from 'react'

const imgGalleryThumbnails = 'https://www.figma.com/api/mcp/asset/4150ed99-7246-4f4d-b590-9cecbc515fe0'
const imgHardDrive = 'https://www.figma.com/api/mcp/asset/0eeba15e-69a0-4c7e-ae93-5e9068777af5'
const imgUploadCloud = 'https://www.figma.com/api/mcp/asset/63b4f2d5-02e8-4632-a545-bf06d9120ce3'
const imgShare2 = 'https://www.figma.com/api/mcp/asset/da08cdfd-1330-4d6d-8a87-af0ddea0f32a'
const imgChevronDown = 'https://www.figma.com/api/mcp/asset/e74a1a48-638b-4ecd-a791-9506cc88d171'
const imgLayoutGrid = 'https://www.figma.com/api/mcp/asset/b8a54c88-7f69-4282-ba49-e985a72d4165'
const imgList = 'https://www.figma.com/api/mcp/asset/81d98a7a-5e45-4aa0-aa86-d2e3aedbc16e'
const imgMynauiPinSolid = 'https://www.figma.com/api/mcp/asset/253789f1-6def-4d0a-89f2-3e80a186d82e'
const imgFrame1 = 'https://www.figma.com/api/mcp/asset/3fcada0b-0a40-4df0-a51a-4497feca8fbb'
const imgMoreHorizontal1 = 'https://www.figma.com/api/mcp/asset/29eb2e5d-67cd-4cf0-8004-a1896e23f4e2'

const imgWrap0 = 'https://www.figma.com/api/mcp/asset/3d06a49f-b840-4c62-b055-08452ae504ce'
const imgWrap1 = 'https://www.figma.com/api/mcp/asset/2657d8ca-1025-437e-8c38-36d73edb234b'
const imgWrap2 = 'https://www.figma.com/api/mcp/asset/7d6f2596-1f86-4556-87ea-66299b1f53eb'
const imgWrap3 = 'https://www.figma.com/api/mcp/asset/da1795ed-06f1-4c3e-9efd-aac2e0e31803'
const imgWrap4 = 'https://www.figma.com/api/mcp/asset/b3df1093-83da-45b8-a620-1d2401a1aab6'
const imgWrap5 = 'https://www.figma.com/api/mcp/asset/38e9a797-56aa-48aa-8ea1-7cd84f0e7784'
const imgWrap6 = 'https://www.figma.com/api/mcp/asset/74ac78c5-e5b3-4d9b-85ac-1fd5149d9655'
const imgWrap7 = 'https://www.figma.com/api/mcp/asset/e189ac34-0eca-4984-b17e-4e320211093e'

const imgEllipse4 = 'https://www.figma.com/api/mcp/asset/c7530330-df26-4070-bbd8-ef98842ee9b8'
const imgEllipse5 = 'https://www.figma.com/api/mcp/asset/07759c2d-35c8-467c-af02-d77d8a81a03e'
const imgEllipse6 = 'https://www.figma.com/api/mcp/asset/9b7993b7-cc61-4b0f-a805-41df9be013da'
const imgEllipse7 = 'https://www.figma.com/api/mcp/asset/cea6ebfa-65fd-4a20-8038-1b34683da47b'

const STATS = [
  { label: 'Total Storage Used', icon: imgGalleryThumbnails, value: '200 GB', sub: 'of 500 GB' },
  { label: 'Free Space', icon: imgHardDrive, value: '300 GB', sub: 'of 500 GB available' },
  { label: 'Last Uploaded', icon: imgUploadCloud, value: 'Yesterday', sub: 'Twilight_movie.mp4 · 1.3 GB' },
  { label: 'Shared with You', icon: imgShare2, value: '2', sub: 'files shared with you' },
]

const STORAGE_TYPES = [
  { label: 'Images', gb: '116 GB', pct: '58%', color: '#0d9488' },
  { label: 'Documents', gb: '116 GB', pct: '58%', color: '#2b7fff' },
  { label: 'Videos', gb: '116 GB', pct: '58%', color: '#8b5cf6' },
  { label: 'Others', gb: '116 GB', pct: '58%', color: '#71717b' },
]

const BAR_DATA = [
  { label: 'Jan', h: 77 },
  { label: 'Feb', h: 111 },
  { label: 'Mar', h: 145 },
  { label: 'Apr', h: 94 },
  { label: 'May', h: 162 },
  { label: 'Jun', h: 128 },
]

const FILES = [
  { name: 'Twilight_movie.mp4', meta: '1.3 GB • Yesterday • Shared', img: imgWrap0, pinned: true },
  { name: 'BalanceSheet.xls', meta: '5.5 MB • 2 days ago', img: imgWrap1, pinned: true },
  { name: 'BalanceSheet.Png', meta: '5.5 MB • 2 days ago', img: imgWrap2, pinned: true },
  { name: 'Documents', meta: '12 Nov • 4.2 GB', img: imgWrap3, pinned: true },
  { name: 'UI Design', meta: '12 Nov • 1.2 GB', img: imgWrap4, pinned: false },
  { name: 'Project_Brief.pdf', meta: 'Shared by Maya Chen • 2h ago', img: imgWrap5, pinned: false },
  { name: 'Mockups_V2.fig', meta: 'Shared by Abdullah • 5h ago', img: imgWrap6, pinned: false },
  { name: 'New Folder', meta: 'empty', img: imgWrap7, pinned: false },
]

const TABS = [
  { label: 'All Files', count: '1,240', dot: imgEllipse4, active: true },
  { label: 'Photos', count: '348', dot: imgEllipse5, active: false },
  { label: 'Documents', count: '348', dot: imgEllipse5, active: false },
  { label: 'Videos', count: '92', dot: imgEllipse6, active: false },
  { label: 'Others', count: '56', dot: imgEllipse7, active: false },
]

export default function Dashboard(): JSX.Element {
  const [activeTab, setActiveTab] = useState(0)
  const [viewGrid, setViewGrid] = useState(true)

  return (
    <div className="flex flex-col gap-8">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-6">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col gap-4 rounded-[16px] bg-white p-6 shadow-[0px_4px_6px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <p className="font-display text-[14px] font-medium text-[#71717b]">{s.label}</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[rgba(13,148,136,0.1)]">
                <img alt="" className="h-[22px] w-[22px]" src={s.icon} />
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
          {/* Donut chart (CSS conic-gradient approximation) */}
          <div className="flex h-[180px] items-center justify-center">
            <div className="relative flex h-[140px] w-[140px] items-center justify-center">
              <svg viewBox="0 0 140 140" className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="70" cy="70" r="52" fill="none" stroke="#e5e5e5" strokeWidth="16" />
                <circle cx="70" cy="70" r="52" fill="none" stroke="#0d9488" strokeWidth="16"
                  strokeDasharray={`${0.58 * 2 * Math.PI * 52} ${2 * Math.PI * 52}`} strokeDashoffset="0" />
                <circle cx="70" cy="70" r="52" fill="none" stroke="#2b7fff" strokeWidth="16"
                  strokeDasharray={`${0.58 * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                  strokeDashoffset={`-${0.58 * 2 * Math.PI * 52}`} />
                <circle cx="70" cy="70" r="52" fill="none" stroke="#8b5cf6" strokeWidth="16"
                  strokeDasharray={`${0.20 * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                  strokeDashoffset={`-${1.16 * 2 * Math.PI * 52}`} />
              </svg>
              <div className="flex flex-col items-center gap-0.5">
                <p className="font-display text-[20px] font-bold text-black">200 GB</p>
                <p className="font-display text-[11px] font-normal text-[#71717b]">Files</p>
              </div>
            </div>
          </div>
          {/* Legend */}
          <div className="flex flex-col gap-2.5">
            {STORAGE_TYPES.map((t) => (
              <div key={t.label} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: t.color }} />
                <p className="flex-1 font-display text-[13px] font-medium text-[#09090b]">{t.label}</p>
                <p className="font-display text-[13px] text-[#71717b]">{t.gb}</p>
                <p className="w-10 text-right font-display text-[13px] font-semibold text-[#09090b]">{t.pct}</p>
                <p className="w-[76px] text-right font-display text-[13px] font-semibold text-[#09090b] underline cursor-pointer">Manage</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart card */}
        <div className="flex flex-1 flex-col gap-8 rounded-[16px] bg-white p-6 shadow-[0px_4px_6px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <p className="font-display text-[16px] font-bold text-[#09090b]">Upload Activity</p>
            <p className="font-display text-[13px] font-semibold text-[#2b7fff]">Last 6 Months</p>
          </div>
          <div className="flex h-[200px] gap-5">
            {/* Y axis */}
            <div className="flex flex-col justify-between pb-5 text-right">
              {['100', '75', '50', '25', '0'].map((v) => (
                <span key={v} className="font-display text-[11px] text-[#71717b]">{v}</span>
              ))}
            </div>
            {/* Bars */}
            <div className="flex flex-1 items-end justify-between pb-5">
              {BAR_DATA.map((b) => (
                <div key={b.label} className="flex flex-col items-center gap-3">
                  <div
                    className="w-12 rounded-t-[6px] bg-[#0d9488]"
                    style={{ height: b.h }}
                  />
                  <span className="font-display text-[11px] text-[#71717b]">{b.label}</span>
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
            <p className="font-display text-[14px] text-[#71717b]">(7)</p>
          </div>
          {/* Filter tabs */}
          <div className="flex gap-[3px]">
            {TABS.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2.5 rounded-[30px] border px-4 py-2.5 transition-all ${
                  activeTab === i
                    ? 'border-[#2b7fff] bg-[#2b7fff] shadow-[0px_4px_4px_rgba(43,127,255,0.3)]'
                    : 'border-[#e5e5e5] bg-white'
                }`}
              >
                <img alt="" className="h-2 w-2" src={tab.dot} />
                <span className={`font-display text-[14px] font-semibold ${activeTab === i ? 'text-white' : 'text-[#09090b]'}`}>
                  {tab.label}
                </span>
                <span className={`font-display text-[13px] ${activeTab === i ? 'text-[rgba(255,255,255,0.7)]' : 'text-[#71717b]'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <button className="flex items-center gap-2 rounded-[8px] border border-[#e5e5e5] bg-white px-3 py-2">
            <span className="font-display text-[13px] font-semibold text-black">Newest First</span>
            <img alt="" className="h-3.5 w-3.5" src={imgChevronDown} />
          </button>
          {/* View toggle */}
          <div className="flex gap-1 rounded-[8px] bg-[#e5e5e5] p-1">
            <button
              onClick={() => setViewGrid(true)}
              className={`flex items-center justify-center rounded-[4px] p-1.5 ${viewGrid ? 'bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.1)]' : ''}`}
            >
              <img alt="" className="h-4 w-4" src={imgLayoutGrid} />
            </button>
            <button
              onClick={() => setViewGrid(false)}
              className={`flex items-center justify-center rounded-[4px] p-1.5 ${!viewGrid ? 'bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.1)]' : ''}`}
            >
              <img alt="" className="h-4 w-4" src={imgList} />
            </button>
          </div>
        </div>
      </div>

      {/* File grid */}
      <div className="grid grid-cols-4 gap-6">
        {FILES.map((f) => (
          <div key={f.name} className="flex flex-col gap-3 rounded-[16px] bg-white p-3 shadow-[0px_4px_6px_rgba(0,0,0,0.03)]">
            {/* Thumbnail */}
            <div className="relative h-[160px] w-full overflow-hidden rounded-[12px]">
              <img alt="" className="h-full w-full object-cover" src={f.img} />
              {f.pinned && (
                <div className="absolute right-3 top-3 flex items-center gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[rgba(255,255,255,0.8)] backdrop-blur-[2px]">
                    <img alt="" className="h-4 w-4" src={imgMynauiPinSolid} />
                  </div>
                  <div className="h-8 w-8">
                    <img alt="" className="h-full w-full" src={imgFrame1} />
                  </div>
                </div>
              )}
            </div>
            {/* Info */}
            <div className="relative flex flex-col gap-0.5">
              <p className="overflow-hidden text-ellipsis whitespace-nowrap font-display text-[12px] font-semibold text-[#09090b]">
                {f.name}
              </p>
              <p className="font-display text-[11px] text-[#71717b]">{f.meta}</p>
              <button className="absolute bottom-0 right-0 flex h-[30px] w-[30px] rotate-90 items-center justify-center">
                <img alt="" className="h-4 w-4" src={imgMoreHorizontal1} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
