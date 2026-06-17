import { ncFetch, getUsername } from './nextcloud'

export interface StorageStats {
  used: number
  total: number
  usedLabel: string
  totalLabel: string
  freeLabel: string
}

export interface StorageBreakdown {
  label: string
  bytes: number
  label_size: string
  percentage: number
  color: string
}

const DEFAULT_STATS: StorageStats = {
  used: 200 * 1073741824,
  total: 500 * 1073741824,
  usedLabel: '200 GB',
  totalLabel: '500 GB',
  freeLabel: '300 GB'
}

const DEFAULT_BREAKDOWN: StorageBreakdown[] = [
  { label: 'Images', bytes: 116e9, label_size: '116 GB', percentage: 58, color: '#0d9488' },
  { label: 'Documents', bytes: 116e9, label_size: '116 GB', percentage: 58, color: '#2b7fff' },
  { label: 'Videos', bytes: 40e9, label_size: '40 GB', percentage: 20, color: '#8b5cf6' },
  { label: 'Others', bytes: 20e9, label_size: '20 GB', percentage: 10, color: '#71717b' }
]

export async function getQuota(): Promise<StorageStats> {
  try {
    const username = await getUsername()
    const res = await ncFetch(`/ocs/v1.php/cloud/users/${username}`)
    if (!res.ok) throw new Error('Quota fetch failed')
    const text = await res.text()
    const usedMatch = text.match(/<quota-used>(\d+)<\/quota-used>/)
    const totalMatch = text.match(/<quota>(\d+)<\/quota>/)
    const used = parseInt(usedMatch?.[1] ?? '0', 10)
    const total = parseInt(totalMatch?.[1] ?? '0', 10)
    const fmt = (b: number): string => `${(b / 1073741824).toFixed(0)} GB`
    return { used, total, usedLabel: fmt(used), totalLabel: fmt(total), freeLabel: fmt(total - used) }
  } catch {
    return DEFAULT_STATS
  }
}

export async function getStorageBreakdown(): Promise<StorageBreakdown[]> {
  return DEFAULT_BREAKDOWN
}
