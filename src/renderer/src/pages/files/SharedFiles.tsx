import { useCallback, useEffect, useState } from 'react'
import FilesBrowser from '../../components/files/FilesBrowser'
import { listSharedWithMe } from '../../services/filesApi'
import type { FileItem } from '../../types/files'

export default function SharedFiles(): JSX.Element {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setFiles(await listSharedWithMe())
    } catch {
      setError('Failed to load shared files')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <FilesBrowser
      title="Shared"
      files={files}
      loading={loading}
      error={error}
      onRefresh={load}
      breadcrumbs={[{ label: 'Dashboard' }, { label: 'Shared' }]}
      emptyMessage="No shared files"
    />
  )
}
