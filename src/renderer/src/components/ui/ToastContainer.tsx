import { useToast, type Toast } from '../../hooks/useToast'

const ICONS: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'i',
}

const COLORS: Record<string, string> = {
  success: 'bg-[#22c55e]',
  error: 'bg-[#ef4444]',
  warning: 'bg-[#f59e0b]',
  info: 'bg-[#2b7fff]',
}

const BORDER: Record<string, string> = {
  success: 'border-[#22c55e]/20',
  error: 'border-[#ef4444]/20',
  warning: 'border-[#f59e0b]/20',
  info: 'border-[#2b7fff]/20',
}

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: () => void }): JSX.Element {
  return (
    <div
      className={`flex w-[360px] items-start gap-3 rounded-[12px] border bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${BORDER[t.type]}`}
    >
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${COLORS[t.type]}`}>
        {ICONS[t.type]}
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="font-display text-[14px] font-semibold text-[#09090b]">{t.message}</p>
        {t.detail && <p className="font-display text-[12px] text-[#71717b]">{t.detail}</p>}
      </div>
      <button onClick={onDismiss} className="shrink-0 text-[#71717b] hover:text-[#09090b]">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

export default function ToastContainer(): JSX.Element {
  const { toasts, dismiss } = useToast()
  if (!toasts.length) return <></>

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto animate-[slideIn_0.2s_ease-out]">
          <ToastItem t={t} onDismiss={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  )
}
