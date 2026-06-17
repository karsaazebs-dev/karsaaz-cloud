import { ReactNode } from 'react'

const imgCloud = 'https://www.figma.com/api/mcp/asset/89e1c81b-80ba-42dd-8728-b0715cc12214'
const imgPackageOpen = 'https://www.figma.com/api/mcp/asset/a5b0b9db-c056-437f-9469-43f98dc1837d'
const imgFlag = 'https://www.figma.com/api/mcp/asset/25167c85-62f4-451b-9a9a-dd56ba65cf35'

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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <div className="relative flex h-[19px] w-[19px] flex-col items-center justify-center">
                <div className="relative h-[13.3px] w-[19px]">
                  <img alt="" className="absolute inset-0 block h-full w-full" src={imgCloud} />
                </div>
                <div className="absolute bottom-[4px] left-1/2 flex h-[11px] w-[11px] -translate-x-1/2 items-center justify-center">
                  <img alt="" className="absolute inset-0 block h-full w-full" src={imgPackageOpen} />
                </div>
              </div>
            </div>
            <p className="font-display text-[18px] font-bold leading-normal text-[#101010]">Storage.io</p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[#e5e7eb] px-3 py-2">
            <img alt="flag" className="h-[14px] w-5 object-cover" src={imgFlag} />
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
