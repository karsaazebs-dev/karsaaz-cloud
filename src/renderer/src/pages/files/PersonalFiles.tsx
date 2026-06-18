import { useEffect, useState } from 'react'
import FilesBrowser from '../../components/files/FilesBrowser'
import { listFiles } from '../../services/filesApi'
import { getUsername } from '../../services/nextcloud'
import type { FileItem } from '../../types/files'

export default function PersonalFiles(): JSX.Element {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const [all, me] = await Promise.all([listFiles('/'), getUsername()])
        setFiles(all.filter((f) => !f.sharedBy && (!f.owner || f.owner === me)))
      } catch {
        setError('Failed to load files')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <FilesBrowser
      title="Personal Files"
      files={files}
      loading={loading}
      error={error}
      breadcrumbs={[{ label: 'Dashboard' }, { label: 'Personal Files' }]}
      emptyMessage="You have no personal files yet"
    />
  )
}
