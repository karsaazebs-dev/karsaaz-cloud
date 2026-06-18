import { useNavigate } from 'react-router-dom'
import OnboardingShell from '../../components/onboarding/OnboardingShell'
import PaginationDots from '../../components/onboarding/PaginationDots'

function VisualPanel(): JSX.Element {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="relative flex h-[320px] w-[320px] items-center justify-center">
        {/* Orbit rings */}
        <div className="absolute inset-0 rounded-full border-[1.8px] border-[rgba(43,127,255,0.2)]" />
        <div className="absolute inset-[60px] rounded-full border-[1.8px] border-[rgba(43,127,255,0.15)]" />

        {/* Center cloud icon */}
        <div className="flex h-[100px] w-[100px] items-center justify-center rounded-[28px] bg-[#2B7FFF] shadow-[0px_20px_60px_rgba(43,127,255,0.35)]">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M24 8C17.373 8 12 13.373 12 20c0 2.21.635 4.277 1.732 6.02C8.516 27.386 5 31.29 5 36c0 3.866 3.134 7 7 7h24c3.866 0 7-3.134 7-7 0-4.71-3.516-8.614-8.732-9.98A11.94 11.94 0 0 0 36 20c0-6.627-5.373-12-12-12z" fill="white" />
          </svg>
        </div>

        {/* Floating file cards */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-[70px] w-[70px] items-center justify-center rounded-[18px] bg-white shadow-md text-2xl">📄</div>
        <div className="absolute right-0 top-1/4 flex h-[60px] w-[60px] items-center justify-center rounded-[18px] bg-white shadow-md text-2xl">📊</div>
        <div className="absolute bottom-4 right-8 flex h-[60px] w-[60px] items-center justify-center rounded-[18px] bg-white shadow-md text-2xl">🖼️</div>
        <div className="absolute bottom-4 left-8 flex h-[60px] w-[60px] items-center justify-center rounded-[18px] bg-white shadow-md text-2xl">👤</div>
        <div className="absolute left-0 top-1/4 flex h-[60px] w-[60px] items-center justify-center rounded-[18px] bg-white shadow-md text-2xl">📁</div>
      </div>
    </div>
  )
}

export default function Onboarding1(): JSX.Element {
  const navigate = useNavigate()

  return (
    <OnboardingShell visualPanel={<VisualPanel />}>
      <div className="flex flex-col gap-12">
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
