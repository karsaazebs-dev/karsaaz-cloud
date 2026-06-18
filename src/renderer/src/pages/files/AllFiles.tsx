import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FilesBrowser from '../../components/files/FilesBrowser'
import { listFiles, deleteFile, createFolder, toggleFavourite, moveFile } from '../../services/filesApi'
import { createShare } from '../../services/sharingApi'
import { useUpload } from '../../hooks/useUpload'
import type { FileItem } from '../../types/files'
import type { FileAction } from '../../components/files/FileContextMenu'

export default function AllFiles(): JSX.Element {
  const navigate = useNavigate()
  const [currentPath, setCurrentPath] = useState('/')
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { uploads } = useUpload()
  const prevCompletedRef = useRef(0)

  const loadFiles = useCallback(async (path: string) => {
    setLoading(true)
    setError('')
    try {
      const result = await listFiles(path)
      setFiles(result)
    } catch {
      setError('Failed to load files')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFiles(currentPath)
  }, [currentPath, loadFiles])

  useEffect(() => {
    const completedNow = uploads.filter((u) => u.status === 'completed').length
    if (completedNow > prevCompletedRef.current) {
      prevCompletedRef.current = completedNow
      loadFiles(currentPath)
    }
  }, [uploads, currentPath, loadFiles])

  const pathParts = currentPath === '/' ? [] : currentPath.split('/').filter(Boolean)

  const breadcrumbs = [
    { label: 'Dashboard', onClick: () => navigate('/app/dashboard') },
    { label: 'All Files', onClick: currentPath !== '/' ? () => setCurrentPath('/') : undefined },
    ...pathParts.map((part, i) => {
      const path = '/' + pathParts.slice(0, i + 1).join('/')
      const isLast = i === pathParts.length - 1
      return { label: part, onClick: isLast ? undefined : () => setCurrentPath(path) }
    })
  ]

  const handleFolderOpen = (file: FileItem): void => {
    if (file.isFolder) setCurrentPath(file.path)
  }

  const handleFileAction = useCallback(async (action: FileAction, file: FileItem) => {
    if (action === 'delete') {
      if (!confirm(`Delete "${file.name}"?`)) return
      try {
        await deleteFile(file.path)
        setFiles((prev) => prev.filter((f) => f.id !== file.id))
      } catch {
        alert('Delete failed')
      }
    } else if (action === 'share') {
      try {
        const share = await createShare(file.path)
        const serverUrl = ((await window.api.store.get('serverUrl')) as string ?? '').replace(/\/$/, '')
        const link = `${serverUrl}/s/${share.token}`
        await navigator.clipboard.writeText(link)
        alert(`Link copied: ${link}`)
      } catch {
        alert('Share failed')
      }
    } else if (action === 'download') {
      try {
        await window.api.file.download(file.path, file.name)
      } catch {
        alert('Download failed')
      }
    } else if (action === 'favourite') {
      try {
        const newVal = !file.favourite
        await toggleFavourite(file.path, newVal)
        setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, favourite: newVal } : f))
      } catch {
        alert('Failed to update favourite')
      }
    } else if (action === 'rename') {
      const newName = prompt('New name:', file.name)
      if (!newName || newName === file.name) return
      const dir = file.path.substring(0, file.path.lastIndexOf('/') + 1)
      const newPath = dir + newName
      try {
        await moveFile(file.path, newPath)
        await loadFiles(currentPath)
      } catch {
        alert('Rename failed')
      }
    }
  }, [currentPath, loadFiles])

  const handleCreateFolder = useCallback(async () => {
    const name = prompt('Folder name:')
    if (!name) return
    const path = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`
    try {
      await createFolder(path)
      await loadFiles(currentPath)
    } catch {
      alert('Create folder failed')
    }
  }, [currentPath, loadFiles])

  return (
    <FilesBrowser
      title="All Files"
      files={files}
      breadcrumbs={breadcrumbs}
      onFolderOpen={handleFolderOpen}
      onFileAction={handleFileAction}
      onCreateFolder={handleCreateFolder}
      currentPath={currentPath}
      loading={loading}
      error={error}
      emptyMessage={currentPath === '/' ? 'No files yet' : 'This folder is empty'}
      emptyCta="Upload Files"
    />
  )
}
