import { ncFetch } from './nextcloud'

export interface StorageRequestItem {
  id: string
  requester_uid: string
  current_bytes: number
  requested_bytes: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  reviewer_uid: string | null
  created_at: number
  updated_at: number
}

const BASE = '/ocs/v1.php/apps/karsaaz_quota/api/v1'

export async function listRequests(): Promise<StorageRequestItem[]> {
  const res = await ncFetch(`${BASE}/requests?format=json`)
  if (!res.ok) throw new Error(`Requests fetch failed: ${res.status}`)
  const data = await res.json()
  return (data?.ocs?.data?.requests ?? []) as StorageRequestItem[]
}

export async function createRequest(requestedBytes: number, reason: string): Promise<void> {
  const res = await ncFetch(`${BASE}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `current_bytes=0&requested_bytes=${encodeURIComponent(requestedBytes)}&reason=${encodeURIComponent(reason)}`
  })
  if (!res.ok) {
    const text = await res.text()
    const msg = text.match(/<message>([^<]+)<\/message>/)?.[1] ?? `Error ${res.status}`
    throw new Error(msg)
  }
}

export async function reviewRequest(id: string, status: 'approved' | 'rejected'): Promise<void> {
  const res = await ncFetch(`${BASE}/requests/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `status=${status}`
  })
  if (!res.ok) throw new Error(`Review failed: ${res.status}`)
}
