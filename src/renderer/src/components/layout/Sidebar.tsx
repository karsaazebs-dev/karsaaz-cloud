import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Folder, ChevronRight, Clock, Files, User, Star, Share2,
  Image, Inbox, Users, Upload, HardDrive, Trash2, Activity, Settings,
  type LucideIcon
} from 'lucide-react'
import StorageWidget from './StorageWidget'

interface NavItemProps {
  to: string
  Icon: LucideIcon
  label: string
}

function NavItem({ to, Icon, label }: NavItemProps): JSX.Element {
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
          <Icon className={`h-5 w-5 shrink-0 ${isActive ? '' : 'opacity-60'}`} />
          <span className="font-display text-[14px] font-semibold">{label}</span>
        </>
      )}
    </NavLink>
  )
}

interface SubNavItemProps {
  to: string
  Icon: LucideIcon
  label: string
}

function SubNavItem({ to, Icon, label }: SubNavItemProps): JSX.Element {
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
          <Icon className={`h-4 w-4 shrink-0 ${isActive ? '' : 'opacity-50'}`} />
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
          <span className="font-display text-[18px] font-bold text-[#2B7FFF]">Karsaaz Cloud</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
          <NavItem to="/app/dashboard" Icon={LayoutDashboard} label="Dashboard" />

          {/* Files accordion */}
          <div>
            <button
              onClick={() => setFilesOpen((v) => !v)}
              className="flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#101010]"
            >
              <Folder className="h-5 w-5 shrink-0 opacity-60" />
              <span className="flex-1 text-left font-display text-[14px] font-semibold">Files</span>
              <ChevronRight
                className="h-4 w-4 shrink-0 opacity-40 transition-transform duration-200"
                style={{ transform: filesOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
              />
            </button>
            {filesOpen && (
              <div className="mt-0.5 flex flex-col gap-0.5">
                <SubNavItem to="/app/files/recent" Icon={Clock} label="Recent Files" />
                <SubNavItem to="/app/files/all" Icon={Files} label="All Files" />
                <SubNavItem to="/app/files/personal" Icon={User} label="Personal Files" />
                <SubNavItem to="/app/files/favourites" Icon={Star} label="Favourites" />
                <SubNavItem to="/app/files/shared" Icon={Share2} label="Shared" />
              </div>
            )}
          </div>

          <NavItem to="/app/media" Icon={Image} label="Media" />
          <NavItem to="/app/requests" Icon={Inbox} label="Requests" />
          <NavItem to="/app/user-management" Icon={Users} label="User Management" />
          <NavItem to="/app/uploads" Icon={Upload} label="Uploads" />
          <NavItem to="/app/on-device" Icon={HardDrive} label="On Device" />
          <NavItem to="/app/deleted" Icon={Trash2} label="Deleted Files" />
          <NavItem to="/app/activities" Icon={Activity} label="Activities" />
        </div>

        {/* Settings pinned to bottom */}
        <div className="shrink-0 border-t border-[#e5e7eb] px-3 py-2">
          <NavItem to="/app/settings" Icon={Settings} label="Settings" />
        </div>
      </nav>

      <StorageWidget />
    </aside>
  )
}
