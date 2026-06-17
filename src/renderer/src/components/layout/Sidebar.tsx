import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import StorageWidget from './StorageWidget'

const imgDashboard = 'https://www.figma.com/api/mcp/asset/28b74a89-0bae-44f2-bad9-29dd9b997f87'
const imgFiles = 'https://www.figma.com/api/mcp/asset/bb8816ab-ee1d-4b7a-a338-b926a9669da1'
const imgArrow = 'https://www.figma.com/api/mcp/asset/7b6a43e6-c219-4365-b6b0-7041c53db6cc'
const imgRecentFiles = 'https://www.figma.com/api/mcp/asset/230d2086-0bea-4d79-bfe5-f3586fd90b70'
const imgAllFiles = 'https://www.figma.com/api/mcp/asset/176935c0-29b5-4736-9217-b339a575ee2a'
const imgPersonalFiles = 'https://www.figma.com/api/mcp/asset/6fc7ca50-cb0a-4759-a892-d2024b75bfdb'
const imgFavourites = 'https://www.figma.com/api/mcp/asset/a4f17dcc-efb7-4590-8ab9-42ec99f1a8f8'
const imgShared = 'https://www.figma.com/api/mcp/asset/a360d4d5-df9b-422d-ba16-c7596b274460'
const imgMedia = 'https://www.figma.com/api/mcp/asset/291d0443-e90a-4db2-95e2-573e6b1f2e9c'
const imgRequests = 'https://www.figma.com/api/mcp/asset/620416ce-f4de-454a-96de-2b2b7b4b4ca6'
const imgUserMgmt = 'https://www.figma.com/api/mcp/asset/92b12bce-cf90-44b8-beca-fc458d72b2db'
const imgUploads = 'https://www.figma.com/api/mcp/asset/0ab0c94a-e780-4035-baf1-a5bc25fc900b'
const imgOnDevice = 'https://www.figma.com/api/mcp/asset/5f0b8d14-22a4-4f32-bca1-1bba9d3b1aa3'
const imgDeleted = 'https://www.figma.com/api/mcp/asset/7766f0ab-7ac5-4eb8-b193-b8a6cc6d6e76'
const imgActivities = 'https://www.figma.com/api/mcp/asset/b2ad3729-6ab6-4d7f-b30c-f7139997a461'
const imgSettings = 'https://www.figma.com/api/mcp/asset/7d8af82c-438c-44d0-896c-6bd439955234'

interface NavItemProps {
  to: string
  icon: string
  label: string
}

function NavItem({ to, icon, label }: NavItemProps): JSX.Element {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex h-10 items-center gap-3 rounded-[10px] px-3 transition-colors ${
          isActive
            ? 'bg-[#2B7FFF] text-white'
            : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#101010]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <img
            alt=""
            className="h-5 w-5 shrink-0"
            src={icon}
            style={{ filter: isActive ? 'brightness(0) invert(1)' : 'opacity(0.6)' }}
          />
          <span className="font-display text-[14px] font-semibold">{label}</span>
        </>
      )}
    </NavLink>
  )
}

interface SubNavItemProps {
  to: string
  icon: string
  label: string
}

function SubNavItem({ to, icon, label }: SubNavItemProps): JSX.Element {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex h-9 items-center gap-2.5 rounded-[8px] pl-9 pr-3 transition-colors ${
          isActive
            ? 'bg-[#eff6ff] text-[#2B7FFF]'
            : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#101010]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <img
            alt=""
            className="h-4 w-4 shrink-0"
            src={icon}
            style={{ filter: isActive ? 'invert(42%) sepia(96%) saturate(500%) hue-rotate(191deg) brightness(103%) contrast(101%)' : 'opacity(0.5)' }}
          />
          <span className="font-display text-[13px] font-medium">{label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar(): JSX.Element {
  const [filesOpen, setFilesOpen] = useState(true)
  const navigate = useNavigate()

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-[#e5e7eb] bg-white">
      {/* Logo */}
      <div className="flex h-[60px] shrink-0 items-center px-5">
        <button onClick={() => navigate('/app/dashboard')} className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#2B7FFF]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2C5.791 2 4 3.791 4 6c0 .738.212 1.426.577 2.007C3.038 8.522 2 9.64 2 11c0 1.657 1.343 3 3 3h6c1.657 0 3-1.343 3-3 0-1.36-1.038-2.478-2.577-2.993C11.788 7.426 12 6.738 12 6c0-2.209-1.791-4-4-4z" fill="white" />
            </svg>
          </div>
          <span className="font-display text-[18px] font-bold text-[#2B7FFF]">Cloudly</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
        <NavItem to="/app/dashboard" icon={imgDashboard} label="Dashboard" />

        {/* Files accordion */}
        <div>
          <button
            onClick={() => setFilesOpen((v) => !v)}
            className="flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#101010]"
          >
            <img alt="" className="h-5 w-5 shrink-0 opacity-60" src={imgFiles} />
            <span className="flex-1 text-left font-display text-[14px] font-semibold">Files</span>
            <img
              alt=""
              className="h-4 w-4 shrink-0 opacity-40 transition-transform duration-200"
              src={imgArrow}
              style={{ transform: filesOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
            />
          </button>
          {filesOpen && (
            <div className="mt-0.5 flex flex-col gap-0.5">
              <SubNavItem to="/app/files/recent" icon={imgRecentFiles} label="Recent Files" />
              <SubNavItem to="/app/files/all" icon={imgAllFiles} label="All Files" />
              <SubNavItem to="/app/files/personal" icon={imgPersonalFiles} label="Personal Files" />
              <SubNavItem to="/app/files/favourites" icon={imgFavourites} label="Favourites" />
              <SubNavItem to="/app/files/shared" icon={imgShared} label="Shared" />
            </div>
          )}
        </div>

        <NavItem to="/app/media" icon={imgMedia} label="Media" />
        <NavItem to="/app/requests" icon={imgRequests} label="Requests" />
        <NavItem to="/app/user-management" icon={imgUserMgmt} label="User Management" />
        <NavItem to="/app/uploads" icon={imgUploads} label="Uploads" />
        <NavItem to="/app/on-device" icon={imgOnDevice} label="On Device" />
        <NavItem to="/app/deleted" icon={imgDeleted} label="Deleted Files" />
        <NavItem to="/app/activities" icon={imgActivities} label="Activities" />

          <div className="mt-auto pt-2">
          <NavItem to="/app/settings" icon={imgSettings} label="Settings" />
        </div>
      </nav>

      <StorageWidget />
    </aside>
  )
}
