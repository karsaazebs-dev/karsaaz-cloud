import { useEffect, useState, type ReactNode } from 'react'
import { useToast } from '../../hooks/useToast'

export default function NetworkGuard({ children }: { children: ReactNode }): JSX.Element {
  const [online, setOnline] = useState(navigator.onLine)
  const { toast } = useToast()

  useEffect(() => {
    const handleOffline = (): void => {
      setOnline(false)
      toast('error', 'No internet connection', 'Check your network and try again.')
    }
    const handleOnline = (): void => {
      setOnline(true)
      toast('success', 'Back online', 'Connection restored.')
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [toast])

  if (!online) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fee2e2]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="font-display text-[18px] font-bold text-[#09090b]">No internet connection</p>
          <p className="mt-1 font-display text-[14px] text-[#71717b]">Check your network settings and try again.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-[10px] bg-[#2b7fff] px-6 py-2.5 font-display text-[14px] font-semibold text-white hover:opacity-90"
        >
          Retry
        </button>
      </div>
    )
  }

  return <>{children}</>
}
