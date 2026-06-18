import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Server, Link, ShieldCheck, Lock, Clock, ChevronRight } from 'lucide-react'
import AuthShell from '../../components/auth/AuthShell'
import { detectServer, saveRecentServer, getRecentServers, type ServerInfo } from '../../services/auth'

export default function ConnectToServer(): JSX.Element {
  const navigate = useNavigate()
  const [serverUrl, setServerUrl] = useState('')
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [recentServers, setRecentServers] = useState<string[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getRecentServers().then(setRecentServers)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!serverUrl.trim()) {
      setServerInfo(null)
      return
    }
    setDetecting(true)
    debounceRef.current = setTimeout(async () => {
      const info = await detectServer(serverUrl)
      setServerInfo(info)
      setDetecting(false)
    }, 600)
  }, [serverUrl])

  const handleContinue = async () => {
    if (!serverUrl.trim()) return
    const cleanUrl = serverUrl.replace(/\/$/, '')
    await window.api.store.set('serverUrl', cleanUrl)
    await saveRecentServer(cleanUrl)
    navigate('/auth/login')
  }

  const handleRecentClick = (url: string) => {
    setServerUrl(url)
  }

  return (
    <AuthShell>
      <div className="flex w-full flex-col gap-10">
        {/* Title */}
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-[32px] font-bold leading-[1.2] text-[#101010]">Connect to Server</h1>
          <p className="text-[15px] font-normal leading-[1.6] text-[#6b7280]">
            Enter your server address to get started. We'll detect your Nextcloud instance automatically.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Server address input */}
          <div className="flex flex-col gap-2">
            <label className="font-display text-sm font-semibold text-[#101010]">Server Address</label>
            <div className="flex h-[52px] items-center gap-3 rounded-[12px] border border-[#e5e7eb] bg-white px-4">
              <Server className="h-5 w-5 shrink-0 text-[#9ca3af]" />
              <input
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://cloud.mycompany.io"
                className="flex-1 border-none bg-transparent text-base text-[#101010] outline-none placeholder:text-[#6b7280]"
              />
              <Link className="h-5 w-5 shrink-0 text-[#d1d5db]" />
            </div>
          </div>

          {/* Server detection status */}
          {detecting && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-[#6b7280]" />
              <p className="font-display text-[13px] font-semibold text-[#6b7280]">Detecting server…</p>
            </div>
          )}
          {!detecting && serverInfo && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#27ae60]" />
              <p className="font-display text-[13px] font-semibold text-[#27ae60]">
                Server detected · Nextcloud v{serverInfo.version}
              </p>
            </div>
          )}
          {!detecting && serverUrl && !serverInfo && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#ef4444]" />
              <p className="font-display text-[13px] font-semibold text-[#ef4444]">Server not found</p>
            </div>
          )}

          {/* Secure connection card — show when detected */}
          {serverInfo && (
            <div className="flex items-center gap-4 rounded-[12px] border-[1.5px] border-[#3d7bff] bg-white p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[20px] bg-[#e8f1ff]">
                <ShieldCheck className="h-5 w-5 text-[#3d7bff]" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <p className="font-display text-sm font-semibold text-black">Secure connection</p>
                <p className="font-display text-[13px] font-medium text-[#6b7280]">
                  {serverInfo.ssl ? 'End-to-end encrypted · SSL verified' : 'HTTP connection (not encrypted)'}
                </p>
              </div>
              <Lock className="h-5 w-5 text-[#d1d5db]" />
            </div>
          )}

          {/* Continue button */}
          <button
            onClick={handleContinue}
            disabled={!serverUrl.trim()}
            className="flex h-14 w-full items-center justify-center gap-2.5 rounded-[12px] border border-[rgba(255,255,255,0.24)] bg-gradient-to-b from-[#5d7cf6] to-[#4e3cf4] text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Continue
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4.167 10h11.666M10 4.167L15.833 10 10 15.833" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-[#e5e7eb]" />

        {/* Recent servers */}
        {recentServers.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6b7280]">Recent servers</p>
            <div className="flex flex-col gap-2">
              {recentServers.slice(0, 2).map((url) => (
                <button
                  key={url}
                  onClick={() => handleRecentClick(url)}
                  className="flex items-center gap-3 rounded-[10px] bg-white p-3 text-left hover:shadow-sm transition-shadow"
                >
                  <Clock className="h-[18px] w-[18px] shrink-0 text-[#9ca3af]" />
                  <div className="flex flex-1 flex-col gap-0.5">
                    <p className="font-display text-[15px] font-semibold text-black">
                      {url.replace(/^https?:\/\//, '')}
                    </p>
                    <p className="font-display text-[13px] font-medium text-[#6b7280]">{url}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#d1d5db]" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-1 w-full text-sm">
        <span className="text-[#6b7280]">Need help?</span>
        <span className="font-semibold text-[#3d7bff] cursor-pointer hover:underline">Setup Guide</span>
      </div>
    </AuthShell>
  )
}
