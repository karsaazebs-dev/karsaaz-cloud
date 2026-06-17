import { useUpload } from '../hooks/useUpload'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function Uploads(): JSX.Element {
  const { uploads, cancelUpload, retryUpload, clearCompleted } = useUpload()

  const active = uploads.filter((u) => u.status === 'uploading' || u.status === 'pending')
  const completed = uploads.filter((u) => u.status === 'completed' || u.status === 'failed' || u.status === 'cancelled')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[20px] font-bold text-[#09090b]">Uploads</h2>
        {completed.length > 0 && (
          <button
            onClick={clearCompleted}
            className="font-display text-[13px] font-semibold text-[#2b7fff]"
          >
            Clear completed
          </button>
        )}
      </div>

      {active.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="font-display text-[14px] font-semibold text-[#71717b]">Active ({active.length})</h3>
          {active.map((u) => (
            <UploadRow key={u.id} upload={u} onCancel={() => cancelUpload(u.id)} />
          ))}
        </section>
      )}

      {completed.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="font-display text-[14px] font-semibold text-[#71717b]">Completed</h3>
          {completed.map((u) => (
            <UploadRow key={u.id} upload={u} onRetry={() => retryUpload(u.id)} />
          ))}
        </section>
      )}

      {uploads.length === 0 && (
        <div className="rounded-[16px] bg-white py-16 text-center shadow-sm">
          <p className="font-display text-[15px] text-[#71717b]">No uploads yet. Drag files onto any Files page to start.</p>
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
  const statusColor = {
    uploading: 'text-[#2b7fff]',
    completed: 'text-[#22c55e]',
    failed: 'text-[#ef4444]',
    cancelled: 'text-[#71717b]',
    pending: 'text-[#71717b]'
  }[upload.status] ?? 'text-[#71717b]'

  return (
    <div className="flex flex-col gap-2 rounded-[12px] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-[14px] font-semibold text-[#09090b]">{upload.name}</p>
          <p className="font-display text-[12px] text-[#71717b]">{formatSize(upload.size)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-display text-[12px] font-medium capitalize ${statusColor}`}>{upload.status}</span>
          {upload.status === 'uploading' && onCancel && (
            <button onClick={onCancel} className="rounded-[6px] border border-[#e5e5e5] px-3 py-1 text-[12px]">Cancel</button>
          )}
          {upload.status === 'failed' && onRetry && (
            <button onClick={onRetry} className="rounded-[6px] bg-[#2b7fff] px-3 py-1 text-[12px] text-white">Retry</button>
          )}
        </div>
      </div>
      {upload.status === 'uploading' && (
        <div className="h-1.5 overflow-hidden rounded-full bg-[#e5e5e5]">
          <div className="h-full rounded-full bg-[#2b7fff] transition-all" style={{ width: `${upload.progress}%` }} />
        </div>
      )}
      {upload.error && <p className="font-display text-[12px] text-[#ef4444]">{upload.error}</p>}
    </div>
  )
}
