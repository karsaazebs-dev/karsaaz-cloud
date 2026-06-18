import { Copy } from 'lucide-react'
import DrawerPanel from '../ui/DrawerPanel'

interface UserCreatedDrawerProps {
  open: boolean
  username: string
  password: string
  onClose: () => void
}

export default function UserCreatedDrawer({ open, username, password, onClose }: UserCreatedDrawerProps): JSX.Element {
  const copyAll = (): void => {
    void navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`)
  }

  const copyPassword = (): void => {
    void navigator.clipboard.writeText(password)
  }

  return (
    <DrawerPanel open={open} onClose={onClose} widthClass="w-[480px]">
      <div className="flex flex-1 flex-col items-center px-8 py-10 text-center">
        <h2 className="font-display text-[28px] font-bold text-[#09090b]">
          User Created <span className="italic font-normal">Successfully</span>
        </h2>

        <div className="mt-10 w-full space-y-5 text-left">
          <div>
            <label className="mb-1.5 block font-display text-[13px] font-medium text-[#71717b]">User Name</label>
            <input readOnly value={username} className="w-full rounded-[10px] border border-[#e5e5e5] bg-[#f8fafc] px-4 py-3 font-display text-[14px]" />
          </div>
          <div>
            <label className="mb-1.5 block font-display text-[13px] font-medium text-[#71717b]">Password</label>
            <div className="relative">
              <input readOnly type="password" value={password} className="w-full rounded-[10px] border border-[#e5e5e5] bg-[#f8fafc] px-4 py-3 pr-16 font-display text-[14px]" />
              <button type="button" onClick={copyPassword} className="absolute right-3 top-1/2 -translate-y-1/2 font-display text-[13px] font-semibold text-[#2b7fff]">
                Copy
              </button>
            </div>
          </div>
        </div>

        <div className="mt-auto w-full space-y-3 pt-10">
          <button
            type="button"
            onClick={copyAll}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-[#e5e5e5] font-display text-[14px] font-semibold text-[#09090b]"
          >
            <Copy className="h-4 w-4" /> Copy Credentials
          </button>
          <button type="button" className="h-12 w-full rounded-[10px] bg-[#2b7fff] font-display text-[15px] font-semibold text-white">
            Send Credentials to user
          </button>
          <button type="button" onClick={onClose} className="pt-2 font-display text-[14px] text-[#71717b] underline">
            Close
          </button>
        </div>
      </div>
    </DrawerPanel>
  )
}
