import { useEffect, useRef, useState } from 'react'
import { Camera, FileText, FolderPlus, Grid, Presentation, Sheet, Upload } from 'lucide-react'
import type { OfficeTemplateType } from '../../services/officeApi'

interface NewFileMenuProps {
  onUploadFiles: () => void
  onUploadCamera?: () => void
  onCreateFolder?: () => void
  onCreateOffice?: (type: OfficeTemplateType) => void
  onCreateText?: () => void
  disabled?: boolean
}

export default function NewFileMenu({
  onUploadFiles,
  onUploadCamera,
  onCreateFolder,
  onCreateOffice,
  onCreateText,
  disabled
}: NewFileMenuProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const pick = (fn: () => void): void => {
    setOpen(false)
    fn()
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-1.5 rounded-[10px] bg-[#6366f1] px-4 font-display text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        New <span className="text-[16px] leading-none">+</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[240px] overflow-hidden rounded-[12px] border border-[#e5e5e5] bg-white py-2 shadow-lg">
          <MenuItem icon={Upload} label="Upload Files" onClick={() => pick(onUploadFiles)} />
          <MenuItem icon={Grid} label="Upload From Other Apps" onClick={() => pick(onUploadFiles)} />
          <MenuItem
            icon={Camera}
            label="Upload From Camera"
            onClick={onUploadCamera ? () => pick(onUploadCamera) : undefined}
          />
          <div className="my-2 border-t border-[#f0f0f2]" />
          {onCreateFolder && (
            <MenuItem icon={FolderPlus} label="Create New Folder" onClick={() => pick(onCreateFolder)} />
          )}
          <MenuItem
            icon={FileText}
            label="New Document"
            onClick={onCreateOffice ? () => pick(() => onCreateOffice('document')) : undefined}
          />
          <MenuItem
            icon={Sheet}
            label="New Spreadsheet"
            onClick={onCreateOffice ? () => pick(() => onCreateOffice('spreadsheet')) : undefined}
          />
          <MenuItem
            icon={Presentation}
            label="New Presentation"
            onClick={onCreateOffice ? () => pick(() => onCreateOffice('presentation')) : undefined}
          />
          <MenuItem
            icon={FileText}
            label="New Text Document"
            onClick={onCreateText ? () => pick(onCreateText) : undefined}
          />
        </div>
      )}
    </div>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  muted
}: {
  icon: typeof Upload
  label: string
  onClick?: () => void
  muted?: boolean
}): JSX.Element {
  const inactive = !onClick
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={inactive}
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left font-display text-[14px] hover:bg-[#f8fafc] disabled:cursor-default ${
        inactive || muted ? 'text-[#a1a1aa]' : 'text-[#09090b]'
      }`}
    >
      <Icon className={`h-[18px] w-[18px] shrink-0 ${inactive ? 'text-[#d4d4d8]' : 'text-[#6366f1]'}`} />
      {label}
    </button>
  )
}
