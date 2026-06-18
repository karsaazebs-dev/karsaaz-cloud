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

        {/* Center share icon */}
        <div className="flex h-[100px] w-[100px] items-center justify-center rounded-[28px] bg-[#10b981] shadow-[0px_20px_60px_rgba(16,185,129,0.35)]">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="8" cy="24" r="5" fill="white" />
            <circle cx="40" cy="10" r="5" fill="white" />
            <circle cx="40" cy="38" r="5" fill="white" />
            <line x1="13" y1="21" x2="35" y2="13" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="13" y1="27" x2="35" y2="35" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Floating file cards */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-[70px] w-[70px] items-center justify-center rounded-[18px] bg-white shadow-md text-2xl">📤</div>
        <div className="absolute right-0 top-1/4 flex h-[60px] w-[60px] items-center justify-center rounded-[18px] bg-white shadow-md text-2xl">🔗</div>
        <div className="absolute bottom-4 right-8 flex h-[60px] w-[60px] items-center justify-center rounded-[18px] bg-white shadow-md text-2xl">📥</div>
        <div className="absolute bottom-4 left-8 flex h-[60px] w-[60px] items-center justify-center rounded-[18px] bg-white shadow-md text-2xl">🔒</div>
        <div className="absolute left-0 top-1/4 flex h-[60px] w-[60px] items-center justify-center rounded-[18px] bg-white shadow-md text-2xl">📊</div>
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
