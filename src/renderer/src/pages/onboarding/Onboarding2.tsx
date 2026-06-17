import { useNavigate } from 'react-router-dom'
import OnboardingShell from '../../components/onboarding/OnboardingShell'
import PaginationDots from '../../components/onboarding/PaginationDots'

const imgLayer1Copy6 = 'https://www.figma.com/api/mcp/asset/20ca7415-ba57-47a0-8d71-2dae37ad3190'
const imgEllipse451 = 'https://www.figma.com/api/mcp/asset/55ce6409-994a-44d6-86b9-6d27fe152e53'
const imgGroup = 'https://www.figma.com/api/mcp/asset/ca4a7445-79de-4742-a17d-b2b88c3a601f'
const imgVscodeIconsFileTypeExcel = 'https://www.figma.com/api/mcp/asset/de82a013-226c-4bee-9176-2e50399b4cce'
const imgGroup1 = 'https://www.figma.com/api/mcp/asset/431eec32-1f8d-44c3-914e-0cf714b90f66'
const imgGlyphsPolyImage = 'https://www.figma.com/api/mcp/asset/c46a205c-056a-41ab-b417-3266ac410e77'

function VisualPanel(): JSX.Element {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {/* Orbit rings */}
      <div className="absolute left-1/2 top-[234px] h-[557px] w-[557px] -translate-x-1/2">
        <img alt="" className="block h-full w-full" src={imgEllipse451} />
      </div>

      {/* Center share icon */}
      <div className="relative flex h-[150px] w-[150px] items-center justify-center overflow-hidden rounded-full">
        <img alt="" className="block h-full w-full" src={imgLayer1Copy6} />
      </div>

      {/* Orbiting file icons */}
      <div className="absolute" style={{ left: 159, top: 236 }}>
        <div className="h-[97px] w-[97px] rotate-[10.85deg] overflow-hidden rounded-[19px] shadow-[0px_0px_0px_3.6px_white]">
          <img alt="" className="block h-full w-full" src={imgGroup} />
        </div>
      </div>
      <div className="absolute" style={{ left: 572, top: 289 }}>
        <div className="h-[97px] w-[97px] rotate-[4.8deg] overflow-hidden rounded-[19px] shadow-[0px_0px_0px_3.6px_white]">
          <img alt="" className="block h-full w-full" src={imgVscodeIconsFileTypeExcel} />
        </div>
      </div>
      <div className="absolute" style={{ left: 561, top: 627 }}>
        <div className="h-[97px] w-[97px] rotate-30 overflow-hidden rounded-[19px] shadow-[0px_0px_0px_3.6px_white]">
          <img alt="" className="block h-full w-full" src={imgGroup1} />
        </div>
      </div>
      <div className="absolute" style={{ left: 168, top: 660 }}>
        <div className="h-[69px] w-[69px] rotate-[-24.29deg] overflow-hidden rounded-[14px] shadow-[0px_0px_0px_3.6px_white]">
          <img alt="" className="block h-full w-full" src={imgGlyphsPolyImage} />
        </div>
      </div>
    </div>
  )
}

export default function Onboarding2(): JSX.Element {
  const navigate = useNavigate()

  return (
    <OnboardingShell visualPanel={<VisualPanel />}>
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-4">
          <div className="text-[44px] font-semibold leading-[1.2] text-[#101010]">
            <p>Access &amp; Share</p>
            <p>Securely</p>
          </div>
          <p className="text-base font-normal leading-[1.6] text-[#6b7280]">
            Upload, preview, sync, and share files with people you trust.
          </p>
        </div>

        <div className="flex flex-col gap-7">
          <PaginationDots total={3} active={1} />
          <button
            onClick={() => navigate('/onboarding/3')}
            className="h-14 w-[460px] rounded-xl border border-[rgba(255,255,255,0.24)] bg-gradient-to-b from-[#5d7cf6] to-[#4e3cf4] text-base font-semibold text-white transition-opacity hover:opacity-90"
          >
            Continue
          </button>
        </div>
      </div>
    </OnboardingShell>
  )
}
