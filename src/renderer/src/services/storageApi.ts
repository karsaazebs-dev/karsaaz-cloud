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

const EMPTY_STATS: StorageStats = { used: 0, total: 0, usedLabel: '0 GB', totalLabel: '—', freeLabel: '—' }

function fmtBytes(b: number): string {
  if (b >= 1099511627776) return `${(b / 1099511627776).toFixed(1)} TB`
  if (b >= 1073741824) return `${(b / 1073741824).toFixed(1)} GB`
  if (b >= 1048576) return `${(b / 1048576).toFixed(0)} MB`
  return `${b} B`
}

export async function getQuota(): Promise<StorageStats> {
  try {
    const username = await getUsername()
    const res = await ncFetch(`/ocs/v1.php/cloud/users/${encodeURIComponent(username)}?format=json`)
    if (!res.ok) throw new Error(`Quota fetch failed: ${res.status}`)
    const data = await res.json()
    const quota = data?.ocs?.data?.quota ?? {}
    const used = Math.max(0, Number(quota.used ?? 0))
    const total = Number(quota.total ?? 0)
    const free = Math.max(0, Number(quota.free ?? 0))
    const hasLimit = total > 0
    return {
      used,
      total: hasLimit ? total : 0,
      usedLabel: fmtBytes(used),
      totalLabel: hasLimit ? fmtBytes(total) : '∞',
      freeLabel: hasLimit ? fmtBytes(free) : '∞'
    }
  } catch {
    return EMPTY_STATS
  }
}

export async function getStorageBreakdown(): Promise<StorageBreakdown[]> {
  return []
}
