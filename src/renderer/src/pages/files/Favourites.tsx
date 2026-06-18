import { useCallback, useEffect, useState } from 'react'
import FilesBrowser from '../../components/files/FilesBrowser'
import { listFavouriteFiles } from '../../services/filesApi'
import type { FileItem } from '../../types/files'

export default function Favourites(): JSX.Element {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setFiles(await listFavouriteFiles())
    } catch {
      setError('Failed to load favourites')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <FilesBrowser
      title="Favourites"
      files={files}
      loading={loading}
      error={error}
      onRefresh={load}
      breadcrumbs={[{ label: 'Dashboard' }, { label: 'Favourites' }]}
      emptyMessage="No favourite files yet"
      emptyCta="Browse Files"
    />
  )
}
