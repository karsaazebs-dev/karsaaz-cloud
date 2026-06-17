import { ncFetch } from './nextcloud'

export interface ShareInfo {
  id: string
  path: string
  shareType: number
  permissions: number
  token?: string
}

export async function createShare(path: string, shareType = 3): Promise<ShareInfo> {
  const res = await ncFetch('/ocs/v2.php/apps/files_sharing/api/v1/shares', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `path=${encodeURIComponent(path)}&shareType=${shareType}`
  })
  if (!res.ok) throw new Error('Share creation failed')
  const text = await res.text()
  const id = text.match(/<id>(\d+)<\/id>/)?.[1] ?? ''
  const token = text.match(/<token>([^<]+)<\/token>/)?.[1]
  return { id, path, shareType, permissions: 1, token }
}

export async function listShares(path: string): Promise<ShareInfo[]> {
  const res = await ncFetch(`/ocs/v2.php/apps/files_sharing/api/v1/shares?path=${encodeURIComponent(path)}`)
  if (!res.ok) return []
  const text = await res.text()
  const shares: ShareInfo[] = []
  const elements = text.match(/<element>[\s\S]*?<\/element>/g) ?? []
  elements.forEach((el) => {
    shares.push({
      id: el.match(/<id>(\d+)<\/id>/)?.[1] ?? '',
      path: el.match(/<path>([^<]+)<\/path>/)?.[1] ?? path,
      shareType: parseInt(el.match(/<share_type>(\d+)<\/share_type>/)?.[1] ?? '0', 10),
      permissions: parseInt(el.match(/<permissions>(\d+)<\/permissions>/)?.[1] ?? '0', 10),
      token: el.match(/<token>([^<]+)<\/token>/)?.[1]
    })
  })
  return shares
}

export async function revokeShare(shareId: string): Promise<void> {
  const res = await ncFetch(`/ocs/v2.php/apps/files_sharing/api/v1/shares/${shareId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Revoke failed')
}
