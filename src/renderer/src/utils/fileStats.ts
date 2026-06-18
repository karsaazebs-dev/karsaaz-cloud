import type { FileItem } from '../types/files'
import type { StorageBreakdown } from '../services/storageApi'

const BREAKDOWN_COLORS = ['#0d9488', '#2b7fff', '#8b5cf6', '#71717b']

function fmtBytes(b: number): string {
  if (b >= 1073741824) return `${(b / 1073741824).toFixed(1)} GB`
  if (b >= 1048576) return `${(b / 1048576).toFixed(0)} MB`
  if (b >= 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${b} B`
}

export function computeBreakdownFromFiles(files: FileItem[]): StorageBreakdown[] {
  const buckets = { Images: 0, Documents: 0, Videos: 0, Others: 0 }
  for (const f of files) {
    if (f.isFolder) continue
    if (f.type === 'image') buckets.Images += f.size
    else if (f.type === 'document') buckets.Documents += f.size
    else if (f.type === 'video') buckets.Videos += f.size
    else buckets.Others += f.size
  }
  const total = Object.values(buckets).reduce((a, b) => a + b, 0) || 1
  return Object.entries(buckets).map(([label, bytes], i) => ({
    label,
    bytes,
    label_size: fmtBytes(bytes),
    percentage: Math.round((bytes / total) * 100),
    color: BREAKDOWN_COLORS[i]
  }))
}

export function getLastUploaded(files: FileItem[]): FileItem | null {
  const filesOnly = files.filter((f) => !f.isFolder && f.size > 0)
  if (!filesOnly.length) return null
  return [...filesOnly].sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())[0]
}

export interface MonthActivity {
  label: string
  count: number
}

export function computeUploadActivity(files: FileItem[]): MonthActivity[] {
  const now = new Date()
  const months: MonthActivity[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    const count = files.filter((f) => {
      if (f.isFolder) return false
      return f.modifiedAt.getMonth() === d.getMonth() && f.modifiedAt.getFullYear() === d.getFullYear()
    }).length
    months.push({ label, count })
  }
  return months
}
