import FilesBrowser from '../../components/files/FilesBrowser'
import { MOCK_FILES, filterSharedFiles } from '../../data/mockFiles'

export default function SharedFiles(): JSX.Element {
  const files = filterSharedFiles(MOCK_FILES)

  return (
    <FilesBrowser
      title="Shared"
      files={files}
      breadcrumbs={[
        { label: 'Dashboard' },
        { label: 'Shared' }
      ]}
      emptyMessage="No shared files"
    />
  )
}
