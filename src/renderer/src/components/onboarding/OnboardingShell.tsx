import { ReactNode } from 'react'

interface OnboardingShellProps {
  visualPanel: ReactNode
  children: ReactNode
}

export default function OnboardingShell({ visualPanel, children }: OnboardingShellProps): JSX.Element {
  return (
    <div className="flex h-full w-full items-start bg-white">
      {/* Left: Visual panel */}
      <div className="flex h-full flex-1 items-center justify-center overflow-hidden bg-gradient-to-r from-[#ecf1ff] to-[#f4f6ff]">
        {visualPanel}
      </div>

      {/* Right: Content panel */}
      <div className="flex h-full w-[605px] shrink-0 flex-col items-start justify-between px-[52px] py-10">
        {/* Header */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2B7FFF]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2C5.791 2 4 3.791 4 6c0 .738.212 1.426.577 2.007C3.038 8.522 2 9.64 2 11c0 1.657 1.343 3 3 3h6c1.657 0 3-1.343 3-3 0-1.36-1.038-2.478-2.577-2.993C11.788 7.426 12 6.738 12 6c0-2.209-1.791-4-4-4z" fill="white" />
              </svg>
            </div>
            <p className="font-display text-[18px] font-bold leading-normal text-[#101010]">Karsaaz Cloud</p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[#e5e7eb] px-3 py-2">
            <span className="text-sm">🇬🇧</span>
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
