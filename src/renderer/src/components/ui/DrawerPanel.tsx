import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface DrawerPanelProps {
  open: boolean
  title?: string
  onClose: () => void
  children: ReactNode
  widthClass?: string
}

export default function DrawerPanel({
  open,
  title,
  onClose,
  children,
  widthClass = 'w-[480px]'
}: DrawerPanelProps): JSX.Element | null {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} aria-label="Close drawer" />
      <aside className={`relative flex h-full flex-col bg-white shadow-2xl ${widthClass}`}>
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-[#e5e5e5] px-6 py-5">
            <h2 className="font-display text-[22px] font-bold text-[#09090b]">{title}</h2>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#71717b] hover:bg-[#f3f4f6]">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
      </aside>
    </div>
  )
}
