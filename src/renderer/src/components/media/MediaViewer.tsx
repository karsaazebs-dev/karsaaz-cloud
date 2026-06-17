import { useEffect } from 'react'
import type { FileItem } from '../types/files'

interface MediaViewerProps {
  files: FileItem[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export default function MediaViewer({ files, index, onClose, onNavigate }: MediaViewerProps): JSX.Element {
  const file = files[index]

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1)
      if (e.key === 'ArrowRight' && index < files.length - 1) onNavigate(index + 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [index, files.length, onClose, onNavigate])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white text-xl hover:bg-white/20"
      >
        ✕
      </button>

      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(index - 1) }}
          className="absolute left-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
        >
          ‹
        </button>
      )}

      <div className="flex max-h-[80vh] max-w-[80vw] flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
        {file.thumbnail ? (
          <img alt={file.name} className="max-h-[70vh] max-w-full rounded-[8px] object-contain" src={file.thumbnail} />
        ) : (
          <div className="flex h-64 w-96 items-center justify-center rounded-[8px] bg-[#1a1a1a] text-6xl">🎬</div>
        )}
        <p className="font-display text-[14px] text-white">{file.name}</p>
      </div>

      {index < files.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(index + 1) }}
          className="absolute right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
        >
          ›
        </button>
      )}
    </div>
  )
}
