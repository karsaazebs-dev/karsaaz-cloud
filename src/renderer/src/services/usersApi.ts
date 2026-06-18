import { ncFetch } from './nextcloud'
import type { CloudUser } from '../types/files'

export async function listUsers(): Promise<CloudUser[]> {
  try {
    const res = await ncFetch('/ocs/v1.php/cloud/users?format=json')
    if (!res.ok) throw new Error('Users fetch failed')
    const data = await res.json()
    const ids: string[] = data?.ocs?.data?.users ?? []
    const users: CloudUser[] = []
    const fmtGb = (b: number): string => `${(b / 1073741824).toFixed(1)} GB`
    for (const id of ids) {
      const uRes = await ncFetch(`/ocs/v1.php/cloud/users/${encodeURIComponent(id)}?format=json`)
      if (!uRes.ok) continue
      const uData = await uRes.json()
      const d = uData?.ocs?.data ?? {}
      const q = d.quota ?? {}
      const usedBytes = Math.max(0, Number(q.used ?? 0))
      const totalBytes = Number(q.total ?? 0)
      const groups: string[] = d.groups ?? []
      users.push({
        id,
        name: d.displayname ?? id,
        email: d.email ?? `${id}@karsaaz.com`,
        quota: totalBytes > 0 ? fmtGb(totalBytes) : '∞',
        used: fmtGb(usedBytes),
        role: groups.includes('admin') ? 'admin' : 'user',
        status: d.enabled ? 'active' : 'disabled'
      })
    }
    return users
  } catch {
    return []
  }
}

export async function createUser(email: string, password: string, quotaGb: number): Promise<void> {
  const userid = email.split('@')[0]
  const res = await ncFetch('/ocs/v1.php/cloud/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `userid=${encodeURIComponent(userid)}&password=${encodeURIComponent(password)}`
  })
  if (!res.ok) throw new Error('User creation failed')
  await ncFetch(`/ocs/v1.php/cloud/users/${userid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `key=quota&value=${quotaGb * 1073741824}`
  })
}

export async function deleteUser(userId: string): Promise<void> {
  const res = await ncFetch(`/ocs/v1.php/cloud/users/${userId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('User deletion failed')
}

export async function setUserEnabled(userId: string, enabled: boolean): Promise<void> {
  const res = await ncFetch(`/ocs/v1.php/cloud/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `key=enabled&value=${enabled ? 'true' : 'false'}`
  })
  if (!res.ok) throw new Error('User update failed')
}
