import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthShell from '../../components/auth/AuthShell'
import { loginWithCredentials } from '../../services/auth'

const imgServer = 'https://www.figma.com/api/mcp/asset/9b1ef516-129e-43fb-8f10-80bf29c7d5df'
const imgUser = 'https://www.figma.com/api/mcp/asset/b9ea65a2-ebf4-4444-9406-9bdb0be7025e'
const imgLock = 'https://www.figma.com/api/mcp/asset/8cf00df4-a698-4593-9ac7-d2b060465277'
const imgEye = 'https://www.figma.com/api/mcp/asset/8ec35ba3-9da5-4f15-861c-cdcde7c74af2'
const imgFingerprint = 'https://www.figma.com/api/mcp/asset/e71139f3-f41d-4dd7-8771-41aa6afe3590'
const imgKey = 'https://www.figma.com/api/mcp/asset/61847b65-f95d-497b-8b09-7ee84549c057'

export default function Login(): JSX.Element {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return
    setLoading(true)
    setError('')
    const serverUrl = (await window.api.store.get('serverUrl')) as string
    const result = await loginWithCredentials(serverUrl, username, password)
    setLoading(false)
    if (!result) {
      setError('Invalid credentials. Please try again.')
      return
    }
    await window.api.store.set('authToken', result.token)
    await window.api.store.set('username', username)
    if (keepSignedIn) {
      await window.api.store.set('keepSignedIn', true)
    }
    navigate('/app/dashboard')
  }

  return (
    <AuthShell onBack={() => navigate('/auth/connect')}>
      <div className="flex w-full flex-col gap-10">
        {/* Title */}
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-[32px] font-bold leading-[1.2] text-[#101010]">Enter Credentials</h1>
          <p className="text-[15px] font-normal leading-[1.6] text-[#6b7280]">Sign in to your Storage.io account.</p>
        </div>

        {/* Server badge */}
        <ServerBadge />

        <div className="flex flex-col gap-6">
          {/* User ID */}
          <div className="flex flex-col gap-2">
            <label className="font-display text-sm font-semibold text-[#101010]">User ID</label>
            <div className="flex h-[52px] items-center gap-3 rounded-[12px] border border-[#e5e7eb] bg-white px-4">
              <img alt="" className="h-5 w-5 shrink-0 opacity-50" src={imgUser} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourname@company.io"
                className="flex-1 border-none bg-transparent text-base text-[#101010] outline-none placeholder:text-[#6b7280]"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="font-display text-sm font-semibold text-[#101010]">Password</label>
            <div className="flex h-[52px] items-center gap-3 rounded-[12px] border border-[#e5e7eb] bg-white px-4">
              <img alt="" className="h-5 w-5 shrink-0 opacity-50" src={imgLock} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="flex-1 border-none bg-transparent text-base text-[#101010] outline-none placeholder:text-[#6b7280]"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button onClick={() => setShowPassword((v) => !v)} className="shrink-0">
                <img alt="toggle" className="h-5 w-5 opacity-40 hover:opacity-70" src={imgEye} />
              </button>
            </div>
          </div>

          {/* Keep signed in */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setKeepSignedIn((v) => !v)}
              className={`flex h-5 w-5 items-center justify-center rounded-[4px] ${keepSignedIn ? 'bg-[#3d7bff]' : 'border border-[#e5e7eb] bg-white'}`}
            >
              {keepSignedIn && (
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span className="font-display text-sm font-semibold text-[#6b7280]">Keep me signed in</span>
          </div>

          {error && <p className="text-sm text-[#ef4444]">{error}</p>}

          {/* Continue button */}
          <button
            onClick={handleLogin}
            disabled={loading || !username.trim() || !password.trim()}
            className="flex h-14 w-full items-center justify-center gap-2.5 rounded-[12px] border border-[rgba(255,255,255,0.24)] bg-gradient-to-b from-[#5d7cf6] to-[#4e3cf4] text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? 'Signing in…' : 'Continue'}
            {!loading && (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4.167 10h11.666M10 4.167L15.833 10 10 15.833" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#e5e7eb]" />
          <span className="font-display text-[13px] font-medium text-[#6b7280]">or continue with</span>
          <div className="h-px flex-1 bg-[#e5e7eb]" />
        </div>

        {/* Alt auth methods */}
        <div className="flex gap-4">
          <button className="flex h-14 flex-1 items-center justify-center gap-2.5 rounded-[12px] border border-[#e5e7eb] bg-white text-base font-semibold text-[#101010] hover:shadow-sm transition-shadow">
            <img alt="" className="h-5 w-5" src={imgFingerprint} />
            Biometric
          </button>
          <button className="flex h-14 flex-1 items-center justify-center gap-2.5 rounded-[12px] border border-[#e5e7eb] bg-white text-base font-semibold text-[#101010] hover:shadow-sm transition-shadow">
            <img alt="" className="h-5 w-5" src={imgKey} />
            Passkey
          </button>
        </div>
      </div>
    </AuthShell>
  )
}

function ServerBadge(): JSX.Element {
  const [serverUrl, setServerUrl] = useState('')

  useState(() => {
    window.api.store.get('serverUrl').then((url) => setServerUrl((url as string) ?? ''))
  })

  return (
    <div className="flex items-center gap-3 rounded-[12px] bg-[#f8fafc] p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white">
        <img alt="" className="h-5 w-5" src={imgServer} />
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="font-display text-sm font-semibold text-black">{serverUrl.replace(/^https?:\/\//, '') || 'Server'}</p>
        <p className="font-display text-[13px] font-medium text-[#6b7280]">Nextcloud · SSL verified</p>
      </div>
      <div className="rounded-[6px] bg-[#d4edda] px-2 py-1">
        <p className="font-display text-[11px] font-bold text-[#27ae60]">Connected</p>
      </div>
    </div>
  )
}
