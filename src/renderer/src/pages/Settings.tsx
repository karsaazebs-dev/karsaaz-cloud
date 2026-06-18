import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../services/auth'
import { useToast } from '../hooks/useToast'
import { ncFetch, getUsername } from '../services/nextcloud'

type Theme = 'light' | 'dark' | 'system'
type UpdateState = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'up-to-date' | 'error'

interface UserInfo {
  displayName: string
  email: string
  serverUrl: string
}

export default function Settings(): JSX.Element {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [theme, setTheme] = useState<Theme>('light')
  const [language, setLanguage] = useState('en')
  const [minimizeToTray, setMinimizeToTray] = useState(false)
  const [notifications, setNotifications] = useState({ sync: true, share: true, upload: true })
  const [updateState, setUpdateState] = useState<UpdateState>('idle')
  const [updateVersion, setUpdateVersion] = useState('')
  const [updateProgress, setUpdateProgress] = useState(0)
  const [userInfo, setUserInfo] = useState<UserInfo>({ displayName: '—', email: '—', serverUrl: '—' })

  useEffect(() => {
    Promise.all([
      window.api.store.get('theme'),
      window.api.store.get('language'),
      window.api.store.get('minimizeToTray'),
      window.api.store.get('notifications')
    ]).then(([t, l, m, n]) => {
      if (t) setTheme(t as Theme)
      if (l) setLanguage(l as string)
      if (m !== undefined) setMinimizeToTray(m as boolean)
      if (n) setNotifications(n as typeof notifications)
    })
    ;(async () => {
      try {
        const [username, serverUrl] = await Promise.all([
          getUsername(),
          window.api.store.get('serverUrl') as Promise<string>
        ])
        const res = await ncFetch(`/ocs/v1.php/cloud/users/${encodeURIComponent(username)}?format=json`)
        if (res.ok) {
          const data = await res.json()
          const d = data?.ocs?.data ?? {}
          const displayName = d.displayname ?? username
          const email = d.email ?? ''
          setUserInfo({ displayName, email, serverUrl: String(serverUrl ?? '').replace(/\/$/, '') })
        } else {
          setUserInfo((u) => ({ ...u, serverUrl: String(serverUrl ?? '') }))
        }
      } catch {
        // keep defaults
      }
    })()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else if (theme === 'light') root.classList.remove('dark')
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    }
    window.api.store.set('theme', theme)
  }, [theme])

  const handleLanguageChange = (lang: string): void => {
    setLanguage(lang)
    window.api.store.set('language', lang)
  }

  useEffect(() => {
    const cleanAvailable = window.api.updater.onAvailable(({ version }) => {
      setUpdateVersion(version)
      setUpdateState('available')
      toast('info', `Update v${version} available`, 'Go to Settings → About to install.')
    })
    const cleanNotAvailable = window.api.updater.onNotAvailable(() => {
      setUpdateState('up-to-date')
    })
    const cleanProgress = window.api.updater.onProgress((pct) => {
      setUpdateState('downloading')
      setUpdateProgress(pct)
    })
    const cleanDownloaded = window.api.updater.onDownloaded(() => {
      setUpdateState('ready')
      toast('success', 'Update ready to install', 'Restart the app to apply the update.')
    })
    const cleanError = window.api.updater.onError((msg) => {
      setUpdateState('error')
      toast('error', 'Update failed', msg)
    })
    return () => {
      cleanAvailable()
      cleanNotAvailable()
      cleanProgress()
      cleanDownloaded()
      cleanError()
    }
  }, [toast])

  const handleCheckUpdates = async (): Promise<void> => {
    setUpdateState('checking')
    await window.api.updater.check()
  }

  const handleSignOut = async (): Promise<void> => {
    await logout()
    navigate('/auth/connect')
  }

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-display text-[20px] font-bold text-[#09090b]">Settings</h2>

      <Section title="Account">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eff6ff] text-2xl">👤</div>
          <div>
            <p className="font-display text-[15px] font-semibold text-[#09090b]">{userInfo.displayName}</p>
            <p className="font-display text-[13px] text-[#71717b]">{userInfo.email || '—'}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-2 rounded-[8px] border border-[#ef4444] px-4 py-2 font-display text-[13px] text-[#ef4444]"
        >
          Sign Out
        </button>
      </Section>

      <Section title="Server">
        <Row label="Server URL" value={userInfo.serverUrl || '—'} />
        <Row label="Connection" value="Connected" valueClass="text-[#22c55e]" />
      </Section>

      <Section title="Sync">
        <label className="flex items-center justify-between">
          <span className="font-display text-[14px] text-[#09090b]">Minimize to tray on close</span>
          <input
            type="checkbox"
            checked={minimizeToTray}
            onChange={(e) => {
              setMinimizeToTray(e.target.checked)
              window.api.store.set('minimizeToTray', e.target.checked)
            }}
            className="h-4 w-4 rounded accent-[#2b7fff]"
          />
        </label>
      </Section>

      <Section title="Notifications">
        {(['sync', 'share', 'upload'] as const).map((key) => (
          <label key={key} className="flex items-center justify-between">
            <span className="font-display text-[14px] capitalize text-[#09090b]">{key} notifications</span>
            <input
              type="checkbox"
              checked={notifications[key]}
              onChange={(e) => {
                const updated = { ...notifications, [key]: e.target.checked }
                setNotifications(updated)
                window.api.store.set('notifications', updated)
              }}
              className="h-4 w-4 rounded accent-[#2b7fff]"
            />
          </label>
        ))}
      </Section>

      <Section title="Appearance">
        <div className="flex flex-col gap-2">
          <label className="font-display text-[13px] font-medium text-[#71717b]">Theme</label>
          <div className="flex gap-2">
            {(['light', 'dark', 'system'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`rounded-[8px] px-4 py-2 font-display text-[13px] capitalize ${
                  theme === t ? 'bg-[#2b7fff] text-white' : 'border border-[#e5e5e5] bg-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <label className="font-display text-[13px] font-medium text-[#71717b]">Language</label>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-48 rounded-[8px] border border-[#e5e5e5] px-4 py-2 font-display text-[14px]"
          >
            <option value="en">English</option>
          </select>
        </div>
      </Section>

      <Section title="About">
        <Row label="Version" value="1.0.0" />
        <Row label="Product" value="Karsaaz Cloud" />
        <Row label="Electron" value={typeof process !== 'undefined' ? (process.versions?.electron ?? 'unknown') : 'unknown'} />

        {/* Update banner */}
        {updateState === 'available' && (
          <div className="flex items-center justify-between rounded-[10px] bg-[#eff6ff] p-3">
            <div>
              <p className="font-display text-[13px] font-semibold text-[#2b7fff]">Update v{updateVersion} available</p>
              <p className="font-display text-[12px] text-[#71717b]">Click Download to get the latest version.</p>
            </div>
            <button
              onClick={() => window.api.updater.download()}
              className="rounded-[8px] bg-[#2b7fff] px-3 py-1.5 font-display text-[12px] font-semibold text-white hover:opacity-90"
            >
              Download
            </button>
          </div>
        )}
        {updateState === 'downloading' && (
          <div className="flex flex-col gap-2 rounded-[10px] bg-[#eff6ff] p-3">
            <div className="flex items-center justify-between">
              <p className="font-display text-[13px] font-semibold text-[#2b7fff]">Downloading update…</p>
              <p className="font-display text-[12px] text-[#71717b]">{updateProgress}%</p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#dbeafe]">
              <div className="h-full rounded-full bg-[#2b7fff] transition-all" style={{ width: `${updateProgress}%` }} />
            </div>
          </div>
        )}
        {updateState === 'ready' && (
          <div className="flex items-center justify-between rounded-[10px] bg-[#f0fdf4] p-3">
            <div>
              <p className="font-display text-[13px] font-semibold text-[#16a34a]">Update ready to install</p>
              <p className="font-display text-[12px] text-[#71717b]">Restart to apply v{updateVersion}.</p>
            </div>
            <button
              onClick={() => window.api.updater.install()}
              className="rounded-[8px] bg-[#16a34a] px-3 py-1.5 font-display text-[12px] font-semibold text-white hover:opacity-90"
            >
              Restart & Install
            </button>
          </div>
        )}
        {updateState === 'up-to-date' && (
          <p className="font-display text-[13px] text-[#16a34a]">✓ You're on the latest version.</p>
        )}
        {updateState === 'error' && (
          <p className="font-display text-[13px] text-[#ef4444]">Update check failed. Try again later.</p>
        )}

        <button
          onClick={handleCheckUpdates}
          disabled={updateState === 'checking' || updateState === 'downloading'}
          className="mt-1 font-display text-[13px] font-semibold text-[#2b7fff] disabled:opacity-40 hover:underline"
        >
          {updateState === 'checking' ? 'Checking…' : 'Check for Updates'}
        </button>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <div className="rounded-[16px] bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-display text-[16px] font-bold text-[#09090b]">{title}</h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function Row({ label, value, valueClass = 'text-[#09090b]' }: { label: string; value: string; valueClass?: string }): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <span className="font-display text-[14px] text-[#71717b]">{label}</span>
      <span className={`font-display text-[14px] font-medium ${valueClass}`}>{value}</span>
    </div>
  )
}
