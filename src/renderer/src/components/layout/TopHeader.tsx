import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Bell } from 'lucide-react'
import { useUpload } from '../../hooks/useUpload'
import { useSearch } from '../../hooks/useSearch'

const ROUTE_TITLES: Record<string, string> = {
  '/app/dashboard': 'Dashboard',
  '/app/files/recent': 'Recent Files',
  '/app/files/all': 'All Files',
  '/app/files/personal': 'Personal Files',
  '/app/files/favourites': 'Favourites',
  '/app/files/shared': 'Shared',
  '/app/media': 'Media',
  '/app/requests': 'Requests',
  '/app/user-management': 'User Management',
  '/app/uploads': 'Uploads',
  '/app/on-device': 'On Device',
  '/app/deleted': 'Deleted Files',
  '/app/activities': 'Activities',
  '/app/settings': 'Settings'
}

export default function TopHeader(): JSX.Element {
  const location = useLocation()
  const { query: search, setQuery: setSearch } = useSearch()
  const [username, setUsername] = useState('User')
  const { uploads, activeCount } = useUpload()
  const title = ROUTE_TITLES[location.pathname] ?? 'Karsaaz Cloud'

  useEffect(() => {
    window.api.store.get('username').then((u) => {
      if (u && typeof u === 'string') setUsername(u)
    })
  }, [])

  const activeUploads = uploads.filter((u) => u.status === 'uploading')
  const overallProgress = activeUploads.length
    ? activeUploads.reduce((sum, u) => sum + u.progress, 0) / activeUploads.length
    : 0

  const initials = username.slice(0, 2).toUpperCase()

  return (
    <header className="flex shrink-0 flex-col border-b border-[#e5e7eb] bg-white">
      {activeCount > 0 && (
        <div className="flex items-center gap-3 border-b border-[#e5e7eb] px-6 py-1.5">
          <span className="font-display text-[12px] font-medium text-[#2b7fff]">
            Uploading {activeCount} file{activeCount > 1 ? 's' : ''}…
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e5e5e5]">
            <div className="h-full rounded-full bg-[#2b7fff] transition-all" style={{ width: `${overallProgress}%` }} />
          </div>
          <span className="font-display text-[11px] text-[#71717b]">{Math.round(overallProgress)}%</span>
        </div>
      )}
      <div className="flex h-[60px] items-center gap-4 px-6">
        <h1 className="font-display text-[18px] font-bold text-[#101010]">{title}</h1>
        <div className="flex h-9 max-w-[400px] flex-1 items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3">
          <Search className="h-4 w-4 shrink-0 text-[#9ca3af]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files, folders…"
            className="flex-1 border-none bg-transparent font-display text-[13px] text-[#101010] outline-none placeholder:text-[#9ca3af]"
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button className="relative flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors hover:bg-[#f3f4f6]">
            <Bell className="h-5 w-5 text-[#6b7280]" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ef4444]" />
          </button>
          <button className="flex items-center gap-2.5 rounded-[10px] border border-[#e5e7eb] bg-white px-3 py-1.5 transition-shadow hover:shadow-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2B7FFF] text-[11px] font-bold text-white">
              {initials}
            </div>
            <div className="flex flex-col items-start">
              <span className="font-display text-[13px] font-semibold leading-tight text-[#101010]">{username}</span>
              <span className="font-display text-[11px] font-medium leading-tight text-[#6b7280]">Administrator</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
