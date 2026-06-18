export function fmtGb(bytes: number, fallback = '—'): string {
  if (bytes <= 0) return fallback
  const gb = bytes / 1_073_741_824
  if (gb < 10) return `${gb.toFixed(1)} GB`
  return `${Math.round(gb)} GB`
}

export function fmtGbDecimal(bytes: number, fallback = '—'): string {
  if (bytes <= 0) return fallback
  return `${(bytes / 1_073_741_824).toFixed(1)} GB`
}

export function fmtPool(bytes: number): string {
  if (bytes >= 1_099_511_627_776) return `${(bytes / 1_099_511_627_776).toFixed(1)} TB`
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(0)} GB`
  return `${bytes} B`
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function relativeTime(epochSec: number): string {
  const diff = Date.now() - epochSec * 1000
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `about ${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
