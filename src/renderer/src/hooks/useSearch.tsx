import { createContext, useContext, useState, type ReactNode } from 'react'

interface SearchContextValue {
  query: string
  setQuery: (query: string) => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

export function SearchProvider({ children }: { children: ReactNode }): JSX.Element {
  const [query, setQuery] = useState('')
  return (
    <SearchContext.Provider value={{ query, setQuery }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error('useSearch must be used within SearchProvider')
  return ctx
}

export function filterFilesByQuery(files: import('../types/files').FileItem[], query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return files
  return files.filter((f) => f.name.toLowerCase().includes(q))
}
