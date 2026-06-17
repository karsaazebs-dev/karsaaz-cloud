import { useNavigate } from 'react-router-dom'
import FilesBrowser from '../../components/files/FilesBrowser'
import { MOCK_FILES, filterRecentFiles } from '../../data/mockFiles'

export default function RecentFiles(): JSX.Element {
  const navigate = useNavigate()
  const files = filterRecentFiles(MOCK_FILES)

  return (
    <FilesBrowser
      title="Recent Files"
      files={files}
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
