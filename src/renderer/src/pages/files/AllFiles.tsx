import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FilesBrowser from '../../components/files/FilesBrowser'
import { MOCK_FILES, MOCK_FOLDER_CONTENTS } from '../../data/mockFiles'
import type { FileItem } from '../../types/files'

export default function AllFiles(): JSX.Element {
  const navigate = useNavigate()
  const [currentPath, setCurrentPath] = useState('/')

  const files: FileItem[] = currentPath === '/'
    ? MOCK_FILES
    : MOCK_FOLDER_CONTENTS[currentPath] ?? []

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

  return (
    <FilesBrowser
      title="All Files"
      files={files}
      breadcrumbs={breadcrumbs}
      onFolderOpen={handleFolderOpen}
      emptyMessage={currentPath === '/' ? 'No files yet' : 'This folder is empty'}
      emptyCta="Upload Files"
    />
  )
}
