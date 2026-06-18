import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import OnboardingShell from '../../components/onboarding/OnboardingShell'

const AVATAR_COLORS = ['#2b7fff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
const AVATAR_INITIALS = ['MC', 'TA', 'AR', 'SA', 'JD']

function VisualPanel(): JSX.Element {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="relative flex h-[320px] w-[320px] items-center justify-center">
        {/* Orbit rings */}
        <div className="absolute inset-0 rounded-full border-[1.9px] border-[rgba(43,127,255,0.1)]" />
        <div className="absolute inset-[40px] rounded-full border-[1.9px] border-[rgba(43,127,255,0.08)]" />

        {/* Center bell */}
        <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-[#2b7fff] shadow-[0px_20px_60px_rgba(43,127,255,0.35)]">
          <Bell className="h-10 w-10 text-white" />
        </div>

        {/* Orbit avatars */}
        {AVATAR_INITIALS.map((init, i) => {
          const angle = (i / AVATAR_INITIALS.length) * 2 * Math.PI - Math.PI / 2
          const r = 140
          const x = Math.cos(angle) * r
          const y = Math.sin(angle) * r
          return (
            <div
              key={init}
              className="absolute flex h-[60px] w-[60px] items-center justify-center rounded-full text-sm font-bold text-white shadow-[0px_0px_0px_3px_white]"
              style={{ background: AVATAR_COLORS[i], transform: `translate(${x}px, ${y}px)` }}
            >
              {init}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Onboarding3(): JSX.Element {
  const navigate = useNavigate()

  const handleTurnOnNotifications = async () => {
    await window.api.store.set('onboarded', true)
    navigate('/auth/connect')
  }

  const handleMaybeLater = async () => {
    await window.api.store.set('onboarded', true)
    navigate('/auth/connect')
  }

  return (
    <OnboardingShell visualPanel={<VisualPanel />}>
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-5">
          <p className="font-display text-[40px] font-bold leading-[1.2] text-[#101010]">Stay in the loop</p>
          <p className="text-base font-normal leading-[1.6] text-[#6b7280]">
            Get notified when your files are shared, synced, or backed up.
          </p>
        </div>

        {/* Notification preview cards */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-[16px] border border-[#e5e7eb] bg-white p-4 shadow-[0px_4px_6px_rgba(0,0,0,0.03)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-[20px] bg-[#10b981] text-sm font-bold text-white">MC</div>
            <div className="flex flex-1 flex-col gap-0.5">
              <p className="font-display text-sm font-semibold text-black">Maya Chen</p>
              <p className="font-display text-[13px] font-medium text-[#6b7280]">Shared Q3_Report.pdf with you</p>
            </div>
            <p className="font-display text-[13px] font-medium text-[#6b7280]">now</p>
          </div>

          <div className="flex items-center gap-3 rounded-[16px] border border-[#e5e7eb] bg-white p-4 shadow-[0px_4px_6px_rgba(0,0,0,0.03)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-[20px] bg-[#f59e0b] text-sm font-bold text-white">TA</div>
            <div className="flex flex-1 flex-col gap-0.5">
              <p className="font-display text-sm font-semibold text-black">Tom Avril</p>
              <p className="font-display text-[13px] font-medium text-[#6b7280]">Backup completed · 22.5 GB synced</p>
            </div>
            <p className="font-display text-[13px] font-medium text-[#6b7280]">2m</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleTurnOnNotifications}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,0.24)] bg-gradient-to-b from-[#5d7cf6] to-[#4e3cf4] text-base font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Bell className="h-5 w-5" />
            Turn on Notifications
          </button>
          <button
            onClick={handleMaybeLater}
            className="font-display text-sm font-semibold text-[#6b7280] hover:text-[#101010] transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </OnboardingShell>
  )
}
