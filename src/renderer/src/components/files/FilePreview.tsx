import { useEffect, useRef, useState } from 'react'
import { X, Download, ExternalLink } from 'lucide-react'
import { resolveDavHref, userPathToAbsoluteUrl } from '../../utils/davPaths'
import type { FileItem } from '../../types/files'

interface FilePreviewProps {
  file: FileItem
  onClose: () => void
}

const IMG_EXT = /\.(jpe?g|png|gif|webp|bmp|svg|avif|ico)$/i
const VID_EXT = /\.(mp4|webm|ogg|mov|m4v)$/i
const PDF_EXT = /\.pdf$/i

function isImage(file: FileItem): boolean {
  return file.type === 'image' || IMG_EXT.test(file.name)
}

function isVideo(file: FileItem): boolean {
  return file.type === 'video' || VID_EXT.test(file.name)
}

function isPdf(file: FileItem): boolean {
  return PDF_EXT.test(file.name)
}

function fileIcon(file: FileItem): string {
  if (file.isFolder) return '📁'
  if (isImage(file)) return '🖼️'
  if (isVideo(file)) return '🎬'
  if (isPdf(file)) return '📕'
  if (file.type === 'document') return '📄'
  return '📎'
}

export default function FilePreview({ file, onClose }: FilePreviewProps): JSX.Element {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const blobRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current)
    }
  }, [])

  useEffect(() => {
    setImageSrc(null)
    setMediaUrl(null)
    if (!file.path) return

    async function load(): Promise<void> {
      const davUrl = await userPathToAbsoluteUrl(file.path)
      setMediaUrl(davUrl)

      if (isImage(file)) {
        setLoading(true)
        try {
          const result = await window.api.nc.fetchBinary(davUrl)
          if (result.ok && result.base64) {
            setImageSrc(`data:${result.contentType || 'image/png'};base64,${result.base64}`)
          }
        } finally {
          setLoading(false)
        }
      }
    }
    load()
  }, [file])

  const handleDownload = (): void => {
    resolveDavHref(file.path)
      .then((href) => window.api.file.download(href, file.name))
      .catch(() => {})
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px]"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex max-h-[90vh] max-w-[90vw] flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl"
        style={{ minWidth: 320, minHeight: 200 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#f0f0f5] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-xl">{fileIcon(file)}</span>
            <div className="min-w-0">
              <p className="truncate font-display text-[15px] font-semibold text-[#09090b]">{file.name}</p>
              <p className="font-display text-[12px] text-[#71717b]">
                {file.sizeLabel !== '—' ? `${file.sizeLabel} • ` : ''}{file.modifiedLabel}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-[8px] border border-[#e5e5e5] px-3 py-1.5 font-display text-[12px] font-semibold text-[#09090b] hover:shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f5f7] hover:bg-[#e5e5e5]"
            >
              <X className="h-4 w-4 text-[#09090b]" />
            </button>
          </div>
        </div>

        {/* Preview body */}
        <div className="flex flex-1 items-center justify-center overflow-auto bg-[#f8fafc] p-4">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2b7fff] border-t-transparent" />
              <p className="font-display text-[12px] text-[#71717b]">Loading preview…</p>
            </div>
          ) : isImage(file) ? (
            imageSrc ? (
              <img
                src={imageSrc}
                alt={file.name}
                className="max-h-[70vh] max-w-[80vw] rounded-[12px] object-contain shadow-sm"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 py-12">
                <span className="text-6xl">🖼️</span>
                <p className="font-display text-[13px] text-[#71717b]">Could not load preview</p>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 rounded-[8px] bg-[#2b7fff] px-4 py-2 font-display text-[13px] font-semibold text-white"
                >
                  <Download className="h-4 w-4" /> Download instead
                </button>
              </div>
            )
          ) : isVideo(file) && mediaUrl ? (
            <video
              src={mediaUrl}
              controls
              autoPlay={false}
              className="max-h-[70vh] max-w-[80vw] rounded-[12px] shadow-sm"
            />
          ) : isPdf(file) ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <span className="text-6xl">📕</span>
              <p className="font-display text-[14px] font-semibold text-[#09090b]">{file.name}</p>
              <a
                href={mediaUrl ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-[8px] bg-[#2b7fff] px-4 py-2 font-display text-[13px] font-semibold text-white"
              >
                <ExternalLink className="h-4 w-4" />
                Open PDF
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 py-16">
              <span className="text-7xl">{fileIcon(file)}</span>
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="font-display text-[16px] font-bold text-[#09090b]">{file.name}</p>
                <p className="font-display text-[13px] text-[#71717b]">
                  {file.sizeLabel !== '—' ? file.sizeLabel : 'Unknown size'} • Last modified {file.modifiedLabel}
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-[10px] bg-[#2b7fff] px-5 py-2.5 font-display text-[14px] font-semibold text-white hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
