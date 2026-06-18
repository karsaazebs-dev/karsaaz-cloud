import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FilesBrowser from '../../components/files/FilesBrowser'
import { listFiles, createFolder } from '../../services/filesApi'
import { useUpload } from '../../hooks/useUpload'
import type { FileItem } from '../../types/files'

export default function AllFiles(): JSX.Element {
  const navigate = useNavigate()
  const [currentPath, setCurrentPath] = useState('/')
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { uploads, setCurrentPath: setUploadPath } = useUpload()
  const prevCompletedRef = useRef(0)

  useEffect(() => {
    setUploadPath(currentPath)
  }, [currentPath, setUploadPath])

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
      onRefresh={() => loadFiles(currentPath)}
      onCreateFolder={handleCreateFolder}
      currentPath={currentPath}
      loading={loading}
      error={error}
      emptyMessage={currentPath === '/' ? 'No files yet' : 'This folder is empty'}
      emptyCta="Upload Files"
    />
  )
}
