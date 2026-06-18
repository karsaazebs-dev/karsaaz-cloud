import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FilesBrowser from '../../components/files/FilesBrowser'
import { listFiles } from '../../services/filesApi'
import type { FileItem } from '../../types/files'

export default function RecentFiles(): JSX.Element {
  const navigate = useNavigate()
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const all = await listFiles('/')
        const cutoff = Date.now() - 7 * 86400000
        const recent = all
          .filter((f) => !f.isFolder && f.modifiedAt.getTime() > cutoff)
          .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
        setFiles(recent)
      } catch {
        setError('Failed to load recent files')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <FilesBrowser
      title="Recent Files"
      files={files}
      loading={loading}
      error={error}
      breadcrumbs={[
        { label: 'Dashboard', onClick: () => navigate('/app/dashboard') },
        { label: 'Recent Files' }
      ]}
      emptyMessage="No recent files in the last 7 days"
      emptyCta="Browse All Files"
      onEmptyCta={() => navigate('/app/files/all')}
    />
  )
}
