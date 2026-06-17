import { ncFetch } from './nextcloud'
import type { CloudUser } from '../types/files'
import { MOCK_USERS } from '../data/mockFiles'

export async function listUsers(): Promise<CloudUser[]> {
  try {
    const res = await ncFetch('/ocs/v1.php/cloud/users?format=json')
    if (!res.ok) throw new Error('Users fetch failed')
    const data = await res.json()
    const ids: string[] = data?.ocs?.data?.users ?? []
    const users: CloudUser[] = []
    for (const id of ids) {
      const uRes = await ncFetch(`/ocs/v1.php/cloud/users/${id}`)
      if (!uRes.ok) continue
      const text = await uRes.text()
      users.push({
        id,
        name: text.match(/<displayname>([^<]+)<\/displayname>/)?.[1] ?? id,
        email: text.match(/<email>([^<]+)<\/email>/)?.[1] ?? `${id}@karsaaz.com`,
        quota: text.match(/<quota>(\d+)<\/quota>/)?.[1] ? `${(parseInt(text.match(/<quota>(\d+)<\/quota>/)![1], 10) / 1073741824).toFixed(0)} GB` : '—',
        used: text.match(/<quota-used>(\d+)<\/quota-used>/)?.[1] ? `${(parseInt(text.match(/<quota-used>(\d+)<\/quota-used>/)![1], 10) / 1073741824).toFixed(0)} GB` : '0 GB',
        role: text.includes('<groups><element>admin</element>') ? 'admin' : 'user',
        status: text.includes('<enabled>1</enabled>') ? 'active' : 'disabled'
      })
    }
    return users
  } catch {
    return MOCK_USERS
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
