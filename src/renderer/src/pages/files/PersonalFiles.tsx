import FilesBrowser from '../../components/files/FilesBrowser'
import { MOCK_FILES, filterPersonalFiles } from '../../data/mockFiles'

export default function PersonalFiles(): JSX.Element {
  const files = filterPersonalFiles(MOCK_FILES)

  return (
    <FilesBrowser
      title="Personal Files"
      files={files}
      breadcrumbs={[
        { label: 'Dashboard' },
        { label: 'Personal Files' }
      ]}
      emptyMessage="You have no personal files yet"
    />
  )
}
