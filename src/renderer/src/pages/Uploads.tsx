import { CheckCircle2, FileImage, FileText, Loader2, RotateCcw, X, XCircle } from 'lucide-react'
import { useUpload } from '../hooks/useUpload'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function fileIcon(name: string): JSX.Element {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    return <FileImage className="h-5 w-5 text-[#6366f1]" />
  }
  return <FileText className="h-5 w-5 text-[#6366f1]" />
}

export default function Uploads(): JSX.Element {
  const { uploads, cancelUpload, retryUpload, clearCompleted } = useUpload()

  const active = uploads.filter((u) => u.status === 'uploading' || u.status === 'pending')
  const completed = uploads.filter((u) => u.status === 'completed' || u.status === 'failed' || u.status === 'cancelled')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[28px] font-bold text-[#09090b]">Uploads</h1>
        {completed.length > 0 && (
          <button
            type="button"
            onClick={clearCompleted}
            className="font-display text-[13px] font-semibold text-[#2b7fff] hover:underline"
          >
            Clear completed
          </button>
        )}
      </div>

      {active.length > 0 && (
        <section className="overflow-hidden rounded-[18px] border border-[rgba(15,23,42,0.08)] bg-white shadow-sm">
          <div className="border-b border-[#f0f0f2] px-6 py-4">
            <h3 className="font-display text-[16px] font-semibold text-[#0f172a]">
              Active <span className="text-[#71717b]">({active.length})</span>
            </h3>
          </div>
          <div className="flex flex-col divide-y divide-[#f0f0f2]">
            {active.map((u) => (
              <UploadRow key={u.id} upload={u} onCancel={() => cancelUpload(u.id)} />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section className="overflow-hidden rounded-[18px] border border-[rgba(15,23,42,0.08)] bg-white shadow-sm">
          <div className="border-b border-[#f0f0f2] px-6 py-4">
            <h3 className="font-display text-[16px] font-semibold text-[#0f172a]">Completed</h3>
          </div>
          <div className="flex flex-col divide-y divide-[#f0f0f2]">
            {completed.map((u) => (
              <UploadRow key={u.id} upload={u} onRetry={() => retryUpload(u.id)} />
            ))}
          </div>
        </section>
      )}

      {uploads.length === 0 && (
        <div className="rounded-[18px] border border-dashed border-[#d4d4d8] bg-white py-20 text-center shadow-sm">
          <Upload className="mx-auto mb-4 h-12 w-12 text-[#a1a1aa]" />
          <p className="font-display text-[16px] font-semibold text-[#09090b]">No uploads yet</p>
          <p className="mt-1 font-display text-[14px] text-[#71717b]">
            Drag files onto any Files page or use New + → Upload Files
          </p>
        </div>
      )}
    </div>
  )
}

interface UploadRowProps {
  upload: { id: string; name: string; size: number; progress: number; status: string; error?: string }
  onCancel?: () => void
  onRetry?: () => void
}

function UploadRow({ upload, onCancel, onRetry }: UploadRowProps): JSX.Element {
  const isUploading = upload.status === 'uploading' || upload.status === 'pending'
  const isFailed = upload.status === 'failed'
  const isDone = upload.status === 'completed'

  return (
    <div className="flex flex-col gap-3 px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#eef2ff]">
          {fileIcon(upload.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[14px] font-semibold text-[#09090b]">{upload.name}</p>
          <p className="font-display text-[12px] text-[#71717b]">{formatSize(upload.size)}</p>
        </div>
        <div className="flex items-center gap-2">
          {isUploading && <Loader2 className="h-4 w-4 animate-spin text-[#2b7fff]" />}
          {isDone && <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />}
          {isFailed && <XCircle className="h-4 w-4 text-[#ef4444]" />}
          <span className={`font-display text-[12px] font-medium capitalize ${
            isFailed ? 'text-[#ef4444]' : isDone ? 'text-[#22c55e]' : 'text-[#2b7fff]'
          }`}>
            {upload.status}
          </span>
          {isUploading && onCancel && (
            <button type="button" onClick={onCancel} className="rounded-[6px] p-1 text-[#71717b] hover:bg-[#f3f4f6]">
              <X className="h-4 w-4" />
            </button>
          )}
          {isFailed && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-1 rounded-[8px] bg-[#2b7fff] px-3 py-1.5 font-display text-[12px] font-semibold text-white"
            >
              <RotateCcw className="h-3 w-3" /> Retry
            </button>
          )}
        </div>
      </div>
      {isUploading && (
        <div className="h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#2b7fff] transition-all"
            style={{ width: `${upload.progress}%` }}
          />
        </div>
      )}
      {upload.error && (
        <p className="font-display text-[12px] text-[#ef4444]">{upload.error}</p>
      )}
    </div>
  )
}

function Upload({ className }: { className?: string }): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
