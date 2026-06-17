import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { UploadItem } from '../types/files'

interface UploadContextValue {
  uploads: UploadItem[]
  activeCount: number
  addFiles: (files: File[]) => void
  cancelUpload: (id: string) => void
  retryUpload: (id: string) => void
  clearCompleted: () => void
}

const UploadContext = createContext<UploadContextValue | null>(null)

function simulateUpload(
  id: string,
  onProgress: (id: string, progress: number) => void,
  onComplete: (id: string, failed?: boolean) => void
): () => void {
  let progress = 0
  let cancelled = false
  const interval = setInterval(() => {
    if (cancelled) return
    progress += Math.random() * 15 + 5
    if (progress >= 100) {
      clearInterval(interval)
      onProgress(id, 100)
      onComplete(id, Math.random() < 0.05)
    } else {
      onProgress(id, Math.min(progress, 99))
    }
  }, 300)
  return () => {
    cancelled = true
    clearInterval(interval)
  }
}

export function UploadProvider({ children }: { children: ReactNode }): JSX.Element {
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [cancellers] = useState<Map<string, () => void>>(new Map())

  const updateUpload = useCallback((id: string, patch: Partial<UploadItem>) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }, [])

  const addFiles = useCallback((files: File[]) => {
    files.forEach((file) => {
      const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const item: UploadItem = {
        id,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'uploading'
      }
      setUploads((prev) => [item, ...prev])
      const cancel = simulateUpload(
        id,
        (uid, progress) => updateUpload(uid, { progress }),
        (uid, failed) => updateUpload(uid, { status: failed ? 'failed' : 'completed', progress: 100, error: failed ? 'Upload failed' : undefined })
      )
      cancellers.set(id, cancel)
    })
  }, [cancellers, updateUpload])

  const cancelUpload = useCallback((id: string) => {
    cancellers.get(id)?.()
    cancellers.delete(id)
    updateUpload(id, { status: 'cancelled' })
  }, [cancellers, updateUpload])

  const retryUpload = useCallback((id: string) => {
    updateUpload(id, { status: 'uploading', progress: 0, error: undefined })
    const cancel = simulateUpload(
      id,
      (uid, progress) => updateUpload(uid, { progress }),
      (uid, failed) => updateUpload(uid, { status: failed ? 'failed' : 'completed', progress: 100 })
    )
    cancellers.set(id, cancel)
  }, [cancellers, updateUpload])

  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status !== 'completed' && u.status !== 'cancelled'))
  }, [])

  const activeCount = uploads.filter((u) => u.status === 'uploading' || u.status === 'pending').length

  return (
    <UploadContext.Provider value={{ uploads, activeCount, addFiles, cancelUpload, retryUpload, clearCompleted }}>
      {children}
    </UploadContext.Provider>
  )
}

export function useUpload(): UploadContextValue {
  const ctx = useContext(UploadContext)
  if (!ctx) throw new Error('useUpload must be used within UploadProvider')
  return ctx
}
