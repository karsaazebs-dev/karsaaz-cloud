import { X } from 'lucide-react'

interface OfficeEditorProps {
  url: string
  title: string
  onClose: () => void
}

export default function OfficeEditor({ url, title, onClose }: OfficeEditorProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-[400] flex flex-col bg-[#f0f2f5]">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#e5e5e5] bg-white px-4">
        <div className="min-w-0">
          <p className="truncate font-display text-[14px] font-semibold text-[#09090b]">{title}</p>
          <p className="font-display text-[11px] text-[#71717b]">Karsaaz Cloud Office</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-[8px] hover:bg-[#f3f4f6]"
          title="Close editor"
        >
          <X className="h-5 w-5 text-[#09090b]" />
        </button>
      </header>
      <iframe
        title={title}
        src={url}
        className="h-full w-full flex-1 border-0 bg-white"
        allow="clipboard-read; clipboard-write; fullscreen"
      />
    </div>
  )
}
