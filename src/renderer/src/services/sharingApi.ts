import { ncFetch, getUsername } from './nextcloud'
import { davHrefToUserPath } from '../utils/davPaths'

export interface ShareInfo {
  id: string
  path: string
  shareType: number
  permissions: number
  token?: string
}

async function resolveUserPath(path: string): Promise<string> {
  const username = await getUsername()
  if (path.includes('/remote.php/dav/')) return davHrefToUserPath(path, username)
  return path.startsWith('/') ? path : `/${path}`
}

function parseShare(data: Record<string, unknown>, userPath: string): ShareInfo {
  return {
    id: String(data.id ?? ''),
    path: String(data.path ?? userPath),
    shareType: Number(data.share_type ?? 3),
    permissions: Number(data.permissions ?? 1),
    token: data.token ? String(data.token) : undefined
  }
}

export async function createShare(path: string, shareType = 3): Promise<ShareInfo> {
  const userPath = await resolveUserPath(path)
  const existing = await listShares(userPath)
  const link = existing.find((s) => s.shareType === 3 && s.token)
  if (link) return link

  const res = await ncFetch('/ocs/v2.php/apps/files_sharing/api/v1/shares?format=json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `path=${encodeURIComponent(userPath)}&shareType=${shareType}&permissions=1`
  })
  if (!res.ok) throw new Error(`Share creation failed: ${res.status}`)
  const data = await res.json()
  const code = data?.ocs?.meta?.statuscode ?? 0
  if (code < 200 || code >= 300) {
    throw new Error(data?.ocs?.meta?.message ?? 'Share creation failed')
  }
  const share = data?.ocs?.data
  if (!share) throw new Error('Share creation failed: invalid response')
  const parsed = parseShare(share as Record<string, unknown>, userPath)
  if (!parsed.token) throw new Error('Share created but no link token returned')
  return parsed
}

export async function listShares(path: string): Promise<ShareInfo[]> {
  const userPath = await resolveUserPath(path)
  const res = await ncFetch(`/ocs/v2.php/apps/files_sharing/api/v1/shares?format=json&path=${encodeURIComponent(userPath)}`)
  if (!res.ok) return []
  const data = await res.json()
  const items = data?.ocs?.data ?? []
  const list = Array.isArray(items) ? items : items ? [items] : []
  return list.map((s: Record<string, unknown>) => parseShare(s, userPath))
}

export async function revokeShare(shareId: string): Promise<void> {
  const res = await ncFetch(`/ocs/v2.php/apps/files_sharing/api/v1/shares/${shareId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Revoke failed')
}
