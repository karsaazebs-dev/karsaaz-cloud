import { useNavigate } from 'react-router-dom'
import OnboardingShell from '../../components/onboarding/OnboardingShell'
import PaginationDots from '../../components/onboarding/PaginationDots'

const imgMember = 'https://www.figma.com/api/mcp/asset/fe5e71a5-dce1-467f-a0be-772dd0f6f64a'
const imgColor = 'https://www.figma.com/api/mcp/asset/45fef34a-2833-4a0b-a41f-9a9b2d446b09'
const imgVscodeIconsFileTypeExcel = 'https://www.figma.com/api/mcp/asset/6e9fe322-67e0-4b58-8ef8-1f23926b5ee2'
const imgGroup = 'https://www.figma.com/api/mcp/asset/d0945a09-bc32-435e-bb29-0217efba7b2b'
const imgGlyphsPolyImage = 'https://www.figma.com/api/mcp/asset/3d99ac88-9d44-46a0-ae74-1ed16d1701a1'
const imgGroup2 = 'https://www.figma.com/api/mcp/asset/26556bbc-74b6-43d8-9913-829cd9f8913d'

function VisualPanel(): JSX.Element {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="absolute left-[130px] top-[224px] h-[575px] w-[575px]">
        {/* Outer orbit ring */}
        <div className="absolute inset-[43px] rounded-full border-[1.8px] border-[rgba(228,228,231,0.7)]" />
        {/* Inner orbit ring */}
        <div className="absolute inset-[115px] rounded-full border-[1.8px] border-[rgba(228,228,231,0.5)]" />

        {/* Center cloud icon */}
        <div className="absolute left-1/2 top-1/2 flex h-[201px] w-[201px] -translate-x-1/2 -translate-y-1/2 flex-col items-start justify-center overflow-hidden rounded-[43px] shadow-[0px_0px_0px_7.2px_white,0px_36px_81px_-21.6px_rgba(20,106,227,0.35)]">
          <img alt="" className="block h-full w-full" src={imgColor} />
        </div>

        {/* Excel icon — top */}
        <div className="absolute left-1/2 top-[-27px] flex h-[115px] w-[115px] -translate-x-1/2 flex-col items-start justify-center overflow-hidden rounded-[29px] shadow-[0px_0px_0px_3.6px_white,0px_21.6px_50px_-14.4px_rgba(0,0,0,0.25)]">
          <img alt="" className="block h-full w-full object-contain p-2.5" src={imgVscodeIconsFileTypeExcel} />
        </div>

        {/* PDF icon — right-middle */}
        <div className="absolute right-[-6px] top-[107px] flex h-[101px] w-[101px] flex-col items-start justify-center overflow-hidden rounded-[29px] shadow-[0px_0px_0px_3.6px_white,0px_21.6px_50px_-14.4px_rgba(0,0,0,0.25)]">
          <img alt="" className="block h-full w-full" src={imgGroup} />
        </div>

        {/* Image icon — bottom-right */}
        <div className="absolute bottom-[58px] right-[22px] flex h-[115px] w-[115px] flex-col items-start justify-center overflow-hidden rounded-[29px] shadow-[0px_0px_0px_3.6px_white,0px_21.6px_50px_-14.4px_rgba(0,0,0,0.25)]">
          <img alt="" className="block h-full w-full object-contain p-5" src={imgGlyphsPolyImage} />
        </div>

        {/* User avatar — bottom-left */}
        <div className="absolute bottom-[72px] left-[14px] flex h-[101px] w-[101px] flex-col items-start justify-center overflow-hidden rounded-[29px] shadow-[0px_0px_0px_3.6px_white,0px_21.6px_50px_-14.4px_rgba(0,0,0,0.25)]">
          <img alt="" className="block h-full w-full object-cover" src={imgMember} />
        </div>

        {/* Doc icon — left */}
        <div className="absolute left-[7px] top-[72px] flex h-[115px] w-[115px] flex-col items-start justify-center overflow-hidden rounded-[29px] shadow-[0px_0px_0px_3.6px_white,0px_21.6px_50px_-14.4px_rgba(0,0,0,0.25)]">
          <img alt="" className="block h-full w-full" src={imgGroup2} />
        </div>
      </div>
    </div>
  )
}

export default function Onboarding1(): JSX.Element {
  const navigate = useNavigate()

  return (
    <OnboardingShell visualPanel={<VisualPanel />}>
      <div className="flex flex-col gap-12">
        {/* Heading + body */}
        <div className="flex flex-col gap-3">
          <div className="text-[44px] font-semibold leading-[1.2] text-[#101010]">
            <p>Your Files,</p>
            <p>Your Cloud,</p>
            <p>Your Control</p>
          </div>
          <p className="text-base font-normal leading-[1.6] text-[#6b7280]">
            Store your files on your own server and access them securely from anywhere.
          </p>
        </div>

        {/* Pagination + CTA */}
        <div className="flex flex-col gap-7">
          <PaginationDots total={3} active={0} />
          <button
            onClick={() => navigate('/onboarding/2')}
            className="h-14 w-[460px] rounded-xl border border-[rgba(255,255,255,0.24)] bg-gradient-to-b from-[#5d7cf6] to-[#4e3cf4] text-base font-semibold text-white transition-opacity hover:opacity-90"
          >
            Continue
          </button>
        </div>
      </div>
    </OnboardingShell>
  )
}
