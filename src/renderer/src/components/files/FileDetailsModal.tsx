import { createPortal } from 'react-dom'
import type { FileItem } from '../../types/files'

interface FileDetailsModalProps {
  file: FileItem
  onClose: () => void
}

export default function FileDetailsModal({ file, onClose }: FileDetailsModalProps): JSX.Element | null {
  const rows = [
    { label: 'Name', value: file.name },
    { label: 'Type', value: file.isFolder ? 'Folder' : file.type },
    { label: 'Size', value: file.sizeLabel },
    { label: 'Modified', value: file.modifiedLabel },
    { label: 'Owner', value: file.owner || '—' },
    { label: 'Path', value: file.path },
    { label: 'Favourite', value: file.favourite ? 'Yes' : 'No' },
    { label: 'Shared', value: file.shared ? (file.sharedBy ? `Yes, by ${file.sharedBy}` : 'Yes') : 'No' }
  ]

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[16px] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-[18px] font-bold text-[#09090b]">Details</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] hover:bg-[#f3f4f6]"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-0.5">
              <span className="font-display text-[12px] font-medium text-[#71717b]">{row.label}</span>
              <span className="break-all font-display text-[14px] text-[#09090b]">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
