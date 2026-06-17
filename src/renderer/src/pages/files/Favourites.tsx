import FilesBrowser from '../../components/files/FilesBrowser'
import { MOCK_FILES, filterFavourites } from '../../data/mockFiles'

export default function Favourites(): JSX.Element {
  const files = filterFavourites(MOCK_FILES)

  return (
    <FilesBrowser
      title="Favourites"
      files={files}
      breadcrumbs={[
        { label: 'Dashboard' },
        { label: 'Favourites' }
      ]}
      emptyMessage="No favourite files yet"
      emptyCta="Browse Files"
    />
  )
}
