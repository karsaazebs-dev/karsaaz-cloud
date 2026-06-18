import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { UploadItem } from '../types/files'

interface UploadContextValue {
  uploads: UploadItem[]
  activeCount: number
  currentPath: string
  setCurrentPath: (path: string) => void
  addFiles: (files: File[], uploadPath?: string) => void
  cancelUpload: (id: string) => void
  retryUpload: (id: string, file?: File, path?: string) => void
  clearCompleted: () => void
}

const UploadContext = createContext<UploadContextValue | null>(null)

interface PendingUpload {
  file: File
  path: string
}

function realUpload(
  id: string,
  file: File,
  remotePath: string,
  onProgress: (id: string, progress: number) => void,
  onComplete: (id: string, failed?: boolean, errMsg?: string) => void
): () => void {
  let aborted = false
  ;(async () => {
    try {
      onProgress(id, 10)
      const buffer = await file.arrayBuffer()
      if (aborted) return
      onProgress(id, 40)
      const cleanPath = remotePath === '/' ? '' : remotePath
      const uploadPath = `${cleanPath}/${encodeURIComponent(file.name)}`
      const result = await window.api.nc.upload(uploadPath, buffer)
      if (aborted) return
      if (result.ok) {
        onProgress(id, 100)
        onComplete(id, false)
      } else {
        onComplete(id, true, result.error ?? `Upload failed (${result.status})`)
      }
    } catch (err) {
      if (!aborted) onComplete(id, true, err instanceof Error ? err.message : 'Upload error')
    }
  })()

  return () => { aborted = true }
}

export function UploadProvider({ children }: { children: ReactNode }): JSX.Element {
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [cancellers] = useState<Map<string, () => void>>(new Map())
  const [pendingFiles] = useState<Map<string, PendingUpload>>(new Map())
  const [currentPath, setCurrentPath] = useState('/')

  const updateUpload = useCallback((id: string, patch: Partial<UploadItem>) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }, [])

  const addFiles = useCallback((files: File[], uploadPath?: string) => {
    const path = uploadPath ?? currentPath
    files.forEach((file) => {
      const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const item: UploadItem = { id, name: file.name, size: file.size, progress: 0, status: 'uploading' }
      setUploads((prev) => [item, ...prev])
      pendingFiles.set(id, { file, path })
      const cancel = realUpload(
        id,
        file,
        path,
        (uid, progress) => updateUpload(uid, { progress }),
        (uid, failed, error) => updateUpload(uid, {
          status: failed ? 'failed' : 'completed',
          progress: 100,
          error: failed ? (error ?? 'Upload failed') : undefined
        })
      )
      cancellers.set(id, cancel)
    })
  }, [cancellers, currentPath, pendingFiles, updateUpload])

  const cancelUpload = useCallback((id: string) => {
    cancellers.get(id)?.()
    cancellers.delete(id)
    updateUpload(id, { status: 'cancelled' })
  }, [cancellers, updateUpload])

  const retryUpload = useCallback((id: string) => {
    const pending = pendingFiles.get(id)
    if (!pending) return
    updateUpload(id, { status: 'uploading', progress: 0, error: undefined })
    const cancel = realUpload(
      id,
      pending.file,
      pending.path,
      (uid, progress) => updateUpload(uid, { progress }),
      (uid, failed, error) => updateUpload(uid, {
        status: failed ? 'failed' : 'completed',
        progress: 100,
        error: failed ? (error ?? 'Upload failed') : undefined
      })
    )
    cancellers.set(id, cancel)
  }, [cancellers, pendingFiles, updateUpload])

  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status !== 'completed' && u.status !== 'cancelled'))
  }, [])

  const activeCount = uploads.filter((u) => u.status === 'uploading' || u.status === 'pending').length

  return (
    <UploadContext.Provider value={{ uploads, activeCount, currentPath, setCurrentPath, addFiles, cancelUpload, retryUpload, clearCompleted }}>
      {children}
    </UploadContext.Provider>
  )
}

export function useUpload(): UploadContextValue {
  const ctx = useContext(UploadContext)
  if (!ctx) throw new Error('useUpload must be used within UploadProvider')
  return ctx
}
