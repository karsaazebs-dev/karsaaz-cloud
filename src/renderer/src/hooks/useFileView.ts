import { useEffect, useMemo, useState } from 'react'
import type { FileItem, SortOption } from '../types/files'
import { filterByType, sortFiles } from '../data/mockFiles'

const VIEW_KEY = 'karsaaz-file-view'
const SORT_KEY = 'karsaaz-file-sort'

export function useFileView(files: FileItem[]) {
  const [activeTab, setActiveTab] = useState(0)
  const [viewGrid, setViewGrid] = useState(() => localStorage.getItem(VIEW_KEY) !== 'list')
  const [sort, setSort] = useState<SortOption>(() => (localStorage.getItem(SORT_KEY) as SortOption) || 'newest')
  const [sortOpen, setSortOpen] = useState(false)
  const [favourites, setFavourites] = useState<Set<string>>(() => new Set(files.filter((f) => f.favourite).map((f) => f.id)))

  useEffect(() => {
    localStorage.setItem(VIEW_KEY, viewGrid ? 'grid' : 'list')
  }, [viewGrid])

  useEffect(() => {
    localStorage.setItem(SORT_KEY, sort)
  }, [sort])

  const displayFiles = useMemo(() => {
    const withFavs = files.map((f) => ({ ...f, favourite: favourites.has(f.id) || f.favourite }))
    return sortFiles(filterByType(withFavs, activeTab), sort)
  }, [files, activeTab, sort, favourites])

  const toggleFavourite = (id: string): void => {
    setFavourites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return {
    activeTab,
    setActiveTab,
    viewGrid,
    setViewGrid,
    sort,
    setSort,
    sortOpen,
    setSortOpen,
    displayFiles,
    toggleFavourite,
    favourites
  }
}
