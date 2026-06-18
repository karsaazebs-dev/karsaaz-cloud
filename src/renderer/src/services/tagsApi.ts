import { ncFetch } from './nextcloud'

export interface SystemTag {
  id: string
  name: string
}

function parseOcsJson<T>(data: { ocs?: { meta?: { statuscode?: number; message?: string }; data?: T } }): T {
  const code = data?.ocs?.meta?.statuscode ?? 0
  if (code < 200 || code >= 300) {
    throw new Error(data?.ocs?.meta?.message ?? `Tag API failed (${code})`)
  }
  return data.ocs!.data as T
}

export async function listSystemTags(): Promise<SystemTag[]> {
  const res = await ncFetch('/ocs/v2.php/apps/files/api/v1/systemtags?format=json')
  if (!res.ok) return []
  const data = await res.json()
  const items = data?.ocs?.data ?? []
  const list = Array.isArray(items) ? items : [items]
  return list
    .filter(Boolean)
    .map((t: Record<string, unknown>) => ({
      id: String(t.id ?? ''),
      name: String(t.name ?? '')
    }))
    .filter((t) => t.id && t.name)
}

export async function createSystemTag(name: string): Promise<SystemTag> {
  const res = await ncFetch('/ocs/v2.php/apps/files/api/v1/systemtags?format=json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `name=${encodeURIComponent(name)}&userVisible=true&userAssignable=true`
  })
  if (!res.ok) throw new Error(`Create tag failed: ${res.status}`)
  const data = await res.json()
  const tag = parseOcsJson<Record<string, unknown>>(data)
  return { id: String(tag.id ?? ''), name: String(tag.name ?? name) }
}

export async function assignTagToFile(fileId: string, tagId: string): Promise<void> {
  const res = await ncFetch(`/ocs/v2.php/apps/files/api/v1/systemtags-relations/${fileId}?format=json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `tagIds[]=${encodeURIComponent(tagId)}`
  })
  if (!res.ok) throw new Error(`Assign tag failed: ${res.status}`)
  const data = await res.json()
  parseOcsJson<unknown>(data)
}

export async function getOrCreateTag(name: string): Promise<SystemTag> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Tag name is required')
  const existing = await listSystemTags()
  const found = existing.find((t) => t.name.toLowerCase() === trimmed.toLowerCase())
  if (found) return found
  return createSystemTag(trimmed)
}
