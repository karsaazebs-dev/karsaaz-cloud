import { useNavigate } from 'react-router-dom'
import OnboardingShell from '../../components/onboarding/OnboardingShell'

const imgUser = 'https://www.figma.com/api/mcp/asset/99913766-1736-4a07-871d-77579ce5450c'
const imgUser1 = 'https://www.figma.com/api/mcp/asset/b1c35a63-98ea-4818-87fb-c257a6074aab'
const imgUser2 = 'https://www.figma.com/api/mcp/asset/331cea17-7707-4529-ae2c-cb57d208696f'
const imgUser3 = 'https://www.figma.com/api/mcp/asset/c98cd1e7-566c-4179-b82f-4e4bbd4ed75b'
const imgUser4 = 'https://www.figma.com/api/mcp/asset/bfd295d7-217e-4d6d-a5e7-15e5373dc03c'
const imgRectangle1 = 'https://www.figma.com/api/mcp/asset/9c3b2c61-39cc-4932-adaa-82a24a126176'
const imgRectangle2 = 'https://www.figma.com/api/mcp/asset/164d524c-bd01-4512-a08d-278d2aec451a'
const imgBell = 'https://www.figma.com/api/mcp/asset/f0320f98-917e-44f3-95d6-dfb5dd4be144'

function VisualPanel(): JSX.Element {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Orbit rings */}
      <div className="absolute left-[123px] top-0 h-[393px] w-[393px] rounded-full border-[1.9px] border-[rgba(43,127,255,0.1)]" />
      <div className="absolute left-[47px] top-[-76px] h-[544px] w-[544px] rounded-full border-[1.9px] border-[rgba(43,127,255,0.05)]" />

      {/* Center large avatar */}
      <div className="relative h-[151px] w-[151px] overflow-hidden rounded-full shadow-[0px_0px_0px_7.6px_white,0px_37.8px_47.2px_-9.4px_rgba(0,0,0,0.1)]">
        <img alt="" className="block h-full w-full object-cover" src={imgUser4} />
      </div>

      {/* Orbit avatars */}
      <div className="absolute left-[45px] top-[8px] h-[91px] w-[91px] overflow-hidden rounded-full shadow-[0px_0px_0px_3.8px_white]">
        <img alt="" className="block h-full w-full object-cover" src={imgUser} />
      </div>
      <div className="absolute right-[30px] top-[23px] h-[83px] w-[83px] overflow-hidden rounded-full shadow-[0px_0px_0px_3.8px_white]">
        <img alt="" className="block h-full w-full object-cover" src={imgUser1} />
      </div>
      <div className="absolute bottom-[30px] left-[15px] h-[76px] w-[76px] overflow-hidden rounded-full shadow-[0px_0px_0px_3.8px_white]">
        <img alt="" className="block h-full w-full object-cover" src={imgUser2} />
      </div>
      <div className="absolute bottom-[15px] right-[45px] h-[91px] w-[91px] overflow-hidden rounded-full shadow-[0px_0px_0px_3.8px_white]">
        <img alt="" className="block h-full w-full object-cover" src={imgUser3} />
      </div>

      {/* Bell badge — blue */}
      <div className="absolute right-[91px] top-[-15px] flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#2b7fff] shadow-[0px_0px_0px_3.8px_white]">
        <img alt="" className="block h-[17px] w-[16px]" src={imgBell} />
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
        {/* Heading + body */}
        <div className="flex flex-col gap-5">
          <p className="font-display text-[40px] font-bold leading-[1.2] text-[#101010]">Stay in the loop</p>
          <p className="text-base font-normal leading-[1.6] text-[#6b7280]">
            Get notified when your files are shared, synced, or backed up.
          </p>
        </div>

        {/* Notification preview cards */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-[16px] border border-[#e5e7eb] bg-white p-4 shadow-[0px_4px_6px_rgba(0,0,0,0.03)]">
            <img alt="" className="h-10 w-10 rounded-[20px] object-cover" src={imgRectangle1} />
            <div className="flex flex-1 flex-col gap-0.5">
              <p className="font-display text-sm font-semibold text-black">Maya Chen</p>
              <p className="font-display text-[13px] font-medium text-[#6b7280]">Shared Q3_Report.pdf with you</p>
            </div>
            <p className="font-display text-[13px] font-medium text-[#6b7280]">now</p>
          </div>

          <div className="flex items-center gap-3 rounded-[16px] border border-[#e5e7eb] bg-white p-4 shadow-[0px_4px_6px_rgba(0,0,0,0.03)]">
            <img alt="" className="h-10 w-10 rounded-[20px] object-cover" src={imgRectangle2} />
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
            <img alt="" className="h-5 w-5" src={imgBell} />
            Turn on Notifications
          </button>
          <button
            onClick={handleMaybeLater}
            className="font-display text-sm font-semibold text-[#6b7280] hover:text-text transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </OnboardingShell>
  )
}
