import { useState, useEffect } from 'react'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import DrawerPanel from '../ui/DrawerPanel'
import type { StorageType } from '../../services/quotaAllocationApi'

export interface AddUserFormData {
  fullName: string
  email: string
  username: string
  password: string
  quotaGb: number
  uploadType: string
  platformAccess: string
  networkBinding: string
  geoRestriction: string
  ipFrom: string
  ipTo: string
  uploadLimitEnabled: boolean
  storageType: StorageType
  uploadLimits: Record<string, { value: string; unit: string }>
}

interface AddUserDrawerProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: AddUserFormData) => Promise<void>
  maxQuotaGb: number
}

function generatePassword(): string {
  const base = Math.random().toString(36).slice(2, 8)
  return `${base}${Math.floor(Math.random() * 90 + 10)}!`
}

const inputCls = 'w-full rounded-[10px] border border-[#e5e5e5] px-4 py-2.5 font-display text-[14px] outline-none focus:border-[#6366f1]'
const labelCls = 'mb-1.5 block font-display text-[13px] font-medium text-[#71717b]'

const DEFAULT_QUOTA_GB = 10

function clampQuotaGb(value: number, max: number): number {
  if (!Number.isFinite(value) || value < 1) return 1
  return Math.min(Math.round(value), Math.max(1, max))
}

export default function AddUserDrawer({ open, onClose, onSubmit, maxQuotaGb }: AddUserDrawerProps): JSX.Element {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState(generatePassword())
  const [showPassword, setShowPassword] = useState(false)
  const [quotaGb, setQuotaGb] = useState(DEFAULT_QUOTA_GB)
  const [uploadType, setUploadType] = useState('PDF, Images, Excel, ALL')
  const [platformAccess, setPlatformAccess] = useState('Mobile, Desktop, Web')
  const [networkBinding, setNetworkBinding] = useState('YES')
  const [geoRestriction, setGeoRestriction] = useState('')
  const [ipFrom, setIpFrom] = useState('192.168.0.100')
  const [ipTo, setIpTo] = useState('192.168.0.500')
  const [uploadLimitEnabled, setUploadLimitEnabled] = useState(true)
  const [uploadLimits, setUploadLimits] = useState<Record<string, { value: string; unit: string }>>({
    PDF: { value: '', unit: 'MBs' },
    Excel: { value: '', unit: 'MBs' },
    Word: { value: '', unit: 'MBs' },
    Images: { value: '', unit: 'MBs' }
  })
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const sliderMax = Math.max(1, maxQuotaGb)

  useEffect(() => {
    if (!open) return
    setFullName('')
    setEmail('')
    setUsername('')
    setPassword(generatePassword())
    setShowPassword(false)
    setQuotaGb(DEFAULT_QUOTA_GB)
    setUploadType('PDF, Images, Excel, ALL')
    setPlatformAccess('Mobile, Desktop, Web')
    setNetworkBinding('YES')
    setGeoRestriction('')
    setIpFrom('192.168.0.100')
    setIpTo('192.168.0.500')
    setUploadLimitEnabled(true)
    setUploadLimits({
      PDF: { value: '', unit: 'MBs' },
      Excel: { value: '', unit: 'MBs' },
      Word: { value: '', unit: 'MBs' },
      Images: { value: '', unit: 'MBs' }
    })
    setSubmitError(null)
  }, [open])

  const storageType: StorageType =
    uploadType.toLowerCase().includes('pdf') || uploadType.toLowerCase().includes('excel')
      ? 'documents'
      : uploadType.toLowerCase().includes('image')
        ? 'media'
        : 'general'

  const handleSubmit = async (): Promise<void> => {
    if (!username.trim() || !password) return
    const finalQuotaGb = clampQuotaGb(quotaGb, sliderMax)
    setBusy(true)
    setSubmitError(null)
    try {
      await onSubmit({
        fullName,
        email,
        username: username.trim(),
        password,
        quotaGb: finalQuotaGb,
        uploadType,
        platformAccess,
        networkBinding,
        geoRestriction,
        ipFrom,
        ipTo,
        uploadLimitEnabled,
        storageType,
        uploadLimits
      })
      onClose()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to create user')
    } finally {
      setBusy(false)
    }
  }

  return (
    <DrawerPanel open={open} title="Add User" onClose={onClose} widthClass="w-[520px]">
      <div className="flex flex-1 flex-col gap-5 px-6 py-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Full Name</label>
            <input className={inputCls} placeholder="Type here" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Email (optional)</label>
            <input className={inputCls} placeholder="yourname@company.io" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>User Name</label>
            <input className={inputCls} placeholder="Type here" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Password</label>
            <div className="relative">
              <input
                className={`${inputCls} pr-20`}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
                <button type="button" onClick={() => setPassword(generatePassword())} className="rounded p-1 text-[#6366f1] hover:bg-[#eef2ff]">
                  <Sparkles className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="rounded p-1 text-[#71717b] hover:bg-[#f3f4f6]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className={labelCls}>Storage Allocation</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={sliderMax}
              step={1}
              value={clampQuotaGb(quotaGb, sliderMax)}
              onChange={(e) => setQuotaGb(clampQuotaGb(Number(e.target.value), sliderMax))}
              className="h-2 flex-1 accent-[#6366f1]"
            />
            <div className="flex items-center gap-1 rounded-[8px] border border-[#e5e5e5] px-3 py-2">
              <input
                type="number"
                min={1}
                max={sliderMax}
                value={quotaGb}
                onChange={(e) => setQuotaGb(clampQuotaGb(Number(e.target.value), sliderMax))}
                className="w-14 border-0 bg-transparent text-center font-display text-[14px] font-semibold outline-none"
              />
              <span className="font-display text-[13px] text-[#71717b]">GB</span>
            </div>
          </div>
          <p className="mt-2 font-display text-[12px] text-[#71717b]">
            This user will receive <span className="font-semibold text-[#09090b]">{clampQuotaGb(quotaGb, sliderMax)} GB</span> of storage.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Upload type</label>
            <select className={inputCls} value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
              <option>PDF, Images, Excel, ALL</option>
              <option>PDF, TXT only</option>
              <option>Images only</option>
              <option>ALL</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Platform Access</label>
            <select className={inputCls} value={platformAccess} onChange={(e) => setPlatformAccess(e.target.value)}>
              <option>Mobile, Desktop, Web</option>
              <option>Desktop, Web</option>
              <option>Mobile only</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Network Binding</label>
            <select className={inputCls} value={networkBinding} onChange={(e) => setNetworkBinding(e.target.value)}>
              <option>YES</option>
              <option>NO</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Geo Restriction (optional)</label>
            <select className={inputCls} value={geoRestriction} onChange={(e) => setGeoRestriction(e.target.value)}>
              <option value="">-- select --</option>
              <option>PK only</option>
              <option>Office network only</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>IP Range (from)</label>
            <input className={inputCls} value={ipFrom} onChange={(e) => setIpFrom(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>IP Range (To)</label>
            <input className={inputCls} value={ipTo} onChange={(e) => setIpTo(e.target.value)} />
          </div>
        </div>

        <div className="rounded-[12px] border border-[#e5e5e5] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-[14px] font-semibold text-[#09090b]">Upload Limit</span>
            <button
              type="button"
              onClick={() => setUploadLimitEnabled((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${uploadLimitEnabled ? 'bg-[#22c55e]' : 'bg-[#d1d5db]'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${uploadLimitEnabled ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
          {uploadLimitEnabled && (
            <div className="flex flex-col gap-2">
              {(['PDF', 'Excel', 'Word', 'Images'] as const).map((type) => (
                <div key={type} className="grid grid-cols-[80px_1fr_80px] items-center gap-2">
                  <span className="font-display text-[13px] text-[#71717b]">{type}</span>
                  <input
                    className={inputCls}
                    placeholder="Enter here"
                    value={uploadLimits[type]?.value ?? ''}
                    onChange={(e) =>
                      setUploadLimits((prev) => ({
                        ...prev,
                        [type]: { ...prev[type], value: e.target.value }
                      }))
                    }
                  />
                  <select
                    className={inputCls}
                    value={uploadLimits[type]?.unit ?? 'MBs'}
                    onChange={(e) =>
                      setUploadLimits((prev) => ({
                        ...prev,
                        [type]: { ...prev[type], unit: e.target.value }
                      }))
                    }
                  >
                    <option>MBs</option>
                    <option>GBs</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {submitError ? (
          <p className="font-display text-[13px] text-[#ef4444]">{submitError}</p>
        ) : null}

        <div className="mt-auto flex flex-col gap-3 pb-6">
          <button
            type="button"
            disabled={busy || !username.trim()}
            onClick={handleSubmit}
            className="h-12 rounded-[10px] bg-gradient-to-r from-[#6366f1] to-[#2b7fff] font-display text-[15px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Confirm & Create User'}
          </button>
          <button type="button" onClick={onClose} className="h-12 rounded-[10px] border border-[#ef4444] font-display text-[15px] font-semibold text-[#ef4444]">
            Cancel
          </button>
        </div>
      </div>
    </DrawerPanel>
  )
}
