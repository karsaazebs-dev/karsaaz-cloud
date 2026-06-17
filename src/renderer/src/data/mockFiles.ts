import type { ActivityEntry, CloudUser, FileItem, FileType, StorageRequest } from '../types/files'

const imgWrap0 = 'https://www.figma.com/api/mcp/asset/3d06a49f-b840-4c62-b055-08452ae504ce'
const imgWrap1 = 'https://www.figma.com/api/mcp/asset/2657d8ca-1025-437e-8c38-36d73edb234b'
const imgWrap2 = 'https://www.figma.com/api/mcp/asset/7d6f2596-1f86-4556-87ea-66299b1f53eb'
const imgWrap3 = 'https://www.figma.com/api/mcp/asset/da1795ed-06f1-4c3e-9efd-aac2e0e31803'
const imgWrap4 = 'https://www.figma.com/api/mcp/asset/b3df1093-83da-45b8-a620-1d2401a1aab6'
const imgWrap5 = 'https://www.figma.com/api/mcp/asset/38e9a797-56aa-48aa-8ea1-7cd84f0e7784'
const imgWrap6 = 'https://www.figma.com/api/mcp/asset/74ac78c5-e5b3-4d9b-85ac-1fd5149d9655'
const imgWrap7 = 'https://www.figma.com/api/mcp/asset/e189ac34-0eca-4984-b17e-4e320211093e'

const daysAgo = (n: number): Date => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

const formatDate = (d: Date): string => {
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const MOCK_FILES: FileItem[] = [
  {
    id: '1', name: 'Twilight_movie.mp4', size: 1395864371, sizeLabel: '1.3 GB',
    modifiedAt: daysAgo(1), modifiedLabel: 'Yesterday', type: 'video', thumbnail: imgWrap0,
    pinned: true, favourite: true, shared: true, owner: 'Alex Johnson', path: '/Twilight_movie.mp4'
  },
  {
    id: '2', name: 'BalanceSheet.xls', size: 5767168, sizeLabel: '5.5 MB',
    modifiedAt: daysAgo(2), modifiedLabel: '2 days ago', type: 'document', thumbnail: imgWrap1,
    pinned: true, favourite: false, path: '/BalanceSheet.xls', owner: 'Alex Johnson'
  },
  {
    id: '3', name: 'BalanceSheet.Png', size: 5767168, sizeLabel: '5.5 MB',
    modifiedAt: daysAgo(2), modifiedLabel: '2 days ago', type: 'image', thumbnail: imgWrap2,
    pinned: true, path: '/BalanceSheet.Png', owner: 'Alex Johnson'
  },
  {
    id: '4', name: 'Documents', size: 0, sizeLabel: '4.2 GB',
    modifiedAt: daysAgo(5), modifiedLabel: '12 Nov', type: 'folder', thumbnail: imgWrap3,
    pinned: true, isFolder: true, path: '/Documents', owner: 'Alex Johnson'
  },
  {
    id: '5', name: 'UI Design', size: 0, sizeLabel: '1.2 GB',
    modifiedAt: daysAgo(5), modifiedLabel: '12 Nov', type: 'folder', thumbnail: imgWrap4,
    isFolder: true, path: '/UI Design', owner: 'Alex Johnson'
  },
  {
    id: '6', name: 'Project_Brief.pdf', size: 2457600, sizeLabel: '2.3 MB',
    modifiedAt: daysAgo(0), modifiedLabel: '2h ago', type: 'document', thumbnail: imgWrap5,
    shared: true, sharedBy: 'Maya Chen', path: '/Project_Brief.pdf', owner: 'Maya Chen'
  },
  {
    id: '7', name: 'Mockups_V2.fig', size: 15728640, sizeLabel: '15 MB',
    modifiedAt: daysAgo(0), modifiedLabel: '5h ago', type: 'other', thumbnail: imgWrap6,
    shared: true, sharedBy: 'Abdullah', path: '/Mockups_V2.fig', owner: 'Abdullah'
  },
  {
    id: '8', name: 'New Folder', size: 0, sizeLabel: 'empty',
    modifiedAt: daysAgo(10), modifiedLabel: '10 days ago', type: 'folder', thumbnail: imgWrap7,
    isFolder: true, path: '/New Folder', owner: 'Alex Johnson'
  },
  {
    id: '9', name: 'Team_Photo.jpg', size: 4194304, sizeLabel: '4 MB',
    modifiedAt: daysAgo(3), modifiedLabel: '3 days ago', type: 'image', thumbnail: imgWrap0,
    favourite: true, path: '/Team_Photo.jpg', owner: 'Alex Johnson'
  },
  {
    id: '10', name: 'Q4_Report.docx', size: 1048576, sizeLabel: '1 MB',
    modifiedAt: daysAgo(14), modifiedLabel: '14 days ago', type: 'document', thumbnail: imgWrap1,
    path: '/Q4_Report.docx', owner: 'Alex Johnson'
  }
]

export const MOCK_FOLDER_CONTENTS: Record<string, FileItem[]> = {
  '/Documents': [
    {
      id: 'd1', name: 'Invoice_2024.pdf', size: 524288, sizeLabel: '512 KB',
      modifiedAt: daysAgo(1), modifiedLabel: formatDate(daysAgo(1)), type: 'document',
      thumbnail: imgWrap1, path: '/Documents/Invoice_2024.pdf', parentPath: '/Documents', owner: 'Alex Johnson'
    },
    {
      id: 'd2', name: 'Contracts', size: 0, sizeLabel: '120 MB',
      modifiedAt: daysAgo(3), modifiedLabel: formatDate(daysAgo(3)), type: 'folder',
      thumbnail: imgWrap3, isFolder: true, path: '/Documents/Contracts', parentPath: '/Documents', owner: 'Alex Johnson'
    }
  ],
  '/UI Design': [
    {
      id: 'u1', name: 'Dashboard.fig', size: 8388608, sizeLabel: '8 MB',
      modifiedAt: daysAgo(2), modifiedLabel: formatDate(daysAgo(2)), type: 'other',
      thumbnail: imgWrap6, path: '/UI Design/Dashboard.fig', parentPath: '/UI Design', owner: 'Alex Johnson'
    }
  ]
}

export const MOCK_ACTIVITIES: ActivityEntry[] = [
  { id: 'a1', user: 'Maya Chen', action: 'shared', target: 'Project_Brief.pdf', timestamp: daysAgo(0), type: 'share' },
  { id: 'a2', user: 'Alex Johnson', action: 'uploaded', target: 'Twilight_movie.mp4', timestamp: daysAgo(1), type: 'upload' },
  { id: 'a3', user: 'Abdullah', action: 'edited', target: 'Mockups_V2.fig', timestamp: daysAgo(0), type: 'edit' },
  { id: 'a4', user: 'Tom Avril', action: 'deleted', target: 'Old_Draft.docx', timestamp: daysAgo(2), type: 'delete' }
]

export const MOCK_REQUESTS: StorageRequest[] = [
  { id: 'r1', user: 'Maya Chen', email: 'maya@karsaaz.com', requestedGb: 50, status: 'pending', createdAt: '2026-06-15' },
  { id: 'r2', user: 'Abdullah', email: 'abdullah@karsaaz.com', requestedGb: 100, status: 'approved', createdAt: '2026-06-10' },
  { id: 'r3', user: 'Tom Avril', email: 'tom@karsaaz.com', requestedGb: 25, status: 'rejected', createdAt: '2026-06-08' }
]

export const MOCK_USERS: CloudUser[] = [
  { id: 'u1', name: 'Alex Johnson', email: 'alex@karsaaz.com', quota: '500 GB', used: '200 GB', role: 'admin', status: 'active' },
  { id: 'u2', name: 'Maya Chen', email: 'maya@karsaaz.com', quota: '200 GB', used: '85 GB', role: 'user', status: 'active' },
  { id: 'u3', name: 'Abdullah', email: 'abdullah@karsaaz.com', quota: '300 GB', used: '150 GB', role: 'user', status: 'active' },
  { id: 'u4', name: 'Tom Avril', email: 'tom@karsaaz.com', quota: '100 GB', used: '95 GB', role: 'user', status: 'disabled' }
]

export function filterRecentFiles(files: FileItem[]): FileItem[] {
  const cutoff = daysAgo(7)
  return files.filter((f) => f.modifiedAt >= cutoff)
}

export function filterPersonalFiles(files: FileItem[], owner = 'Alex Johnson'): FileItem[] {
  return files.filter((f) => f.owner === owner)
}

export function filterFavourites(files: FileItem[]): FileItem[] {
  return files.filter((f) => f.favourite)
}

export function filterSharedFiles(files: FileItem[]): FileItem[] {
  return files.filter((f) => f.shared)
}

export function filterByType(files: FileItem[], tab: number): FileItem[] {
  if (tab === 0) return files
  const map: Record<number, FileType> = { 1: 'image', 2: 'document', 3: 'video', 4: 'other' }
  const type = map[tab]
  return type ? files.filter((f) => f.type === type || (type === 'other' && !['image', 'document', 'video', 'folder'].includes(f.type))) : files
}

export function sortFiles(files: FileItem[], sort: string): FileItem[] {
  const sorted = [...files]
  switch (sort) {
    case 'oldest':
      return sorted.sort((a, b) => a.modifiedAt.getTime() - b.modifiedAt.getTime())
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name))
    case 'size':
      return sorted.sort((a, b) => b.size - a.size)
    default:
      return sorted.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
  }
}

export function getTabCounts(files: FileItem[]): string[] {
  return [
    String(files.length),
    String(files.filter((f) => f.type === 'image').length),
    String(files.filter((f) => f.type === 'document').length),
    String(files.filter((f) => f.type === 'video').length),
    String(files.filter((f) => f.type === 'other').length)
  ]
}
