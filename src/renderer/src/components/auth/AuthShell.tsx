import { ReactNode } from 'react'

const imgFrame = 'https://www.figma.com/api/mcp/asset/ed561bd7-4d8f-459a-9b68-4205a37e352e'
const imgEllipse = 'https://www.figma.com/api/mcp/asset/fe8dfc7e-5887-443a-91b5-674af0c8a682'
const imgFlag = 'https://www.figma.com/api/mcp/asset/848ede30-6d26-4a7a-b09b-816c6a968358'

const DOTS = Array.from({ length: 46 })

interface AuthShellProps {
  children: ReactNode
  onBack?: () => void
}

export default function AuthShell({ children, onBack }: AuthShellProps): JSX.Element {
  return (
    <div className="flex h-full w-full items-start bg-white">
      {/* Left dark panel */}
      <div className="relative flex h-full w-[547px] shrink-0 items-center justify-center overflow-hidden bg-gradient-to-r from-[#1a3a6e] to-[#2d5bb0]">
        {/* Dot grid */}
        <div className="absolute inset-0 flex flex-wrap content-start gap-10 p-10">
          {DOTS.map((_, i) => (
            <img key={i} alt="" className="h-1 w-1 shrink-0" src={imgEllipse} />
          ))}
        </div>

        {/* Logo */}
        <div className="relative flex flex-col items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-lg">
              <img alt="" className="block h-[30px] w-[43px]" src={imgFrame} />
            </div>
            <p className="font-display text-[40px] font-bold text-white">Storage.io</p>
          </div>
          <div className="text-center text-[18px] font-medium leading-[1.4] text-[#94b8ff]">
            <p>Self-hosted storage,</p>
            <p>your rules.</p>
          </div>
        </div>
      </div>

      {/* Right content panel */}
      <div className="flex h-full flex-1 flex-col items-start justify-between bg-[#f8fafc] px-[60px] py-10">
        {/* Header */}
        <div className="flex w-full items-center justify-between">
          {onBack ? (
            <button onClick={onBack} className="flex h-6 w-6 items-center justify-center text-text-muted hover:text-text">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <div className="w-6" />
          )}
          <div className="flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-3 py-2">
            <img alt="flag" className="h-[14px] w-5 rounded-sm object-cover" src={imgFlag} />
            <span className="font-display text-sm font-semibold text-[#101010]">ENG</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {children}

        <div className="h-10 opacity-0" />
      </div>
    </div>
  )
}
