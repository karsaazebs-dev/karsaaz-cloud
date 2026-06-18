import { ncFetch } from './nextcloud'

export type StorageType = 'general' | 'documents' | 'media'

const BASE = '/ocs/v2.php/apps/karsaaz_quota/api/v1'
const GB = 1_073_741_824

export interface PoolInfo {
  total_bytes: number
  distributed_bytes: number
  available_bytes: number
}

export interface UserProfile {
  uploadType?: string
  platformAccess?: string
  networkBinding?: string
  geoRestriction?: string
  ipFrom?: string
  ipTo?: string
  uploadLimitEnabled?: boolean
  uploadLimits?: Record<string, { value: string; unit: string }>
}

export interface ManagedUser {
  uid: string
  displayName: string
  email: string
  role: string
  enabled: boolean
  allocated_bytes: number
  used_bytes: number
  storage_type?: StorageType
  profile?: UserProfile | null
  updated_at: number
}

export interface StorageRequestItem {
  id: string
  requester_uid: string
  current_bytes: number
  requested_bytes: number
  reason: string
  storage_type?: StorageType
  status: 'pending' | 'approved' | 'rejected'
  reviewer_uid: string | null
  admin_notes?: string | null
  created_at: number
  updated_at: number
}

export interface ProvisionUserPayload {
  userid: string
  password: string
  displayName?: string
  email?: string
  quota_gb: number
  storage_type?: StorageType
  profile?: UserProfile
}

async function parseOcs<T>(res: Response): Promise<T> {
  const text = await res.text()
  let data: {
    ocs?: { meta?: { status?: string; message?: string }; data?: { error?: string } & T }
  } = {}
  try {
    data = JSON.parse(text)
  } catch {
    const msg = text.match(/<message>([^<]+)<\/message>/)?.[1]
    throw new Error(msg ?? `Request failed: ${res.status}`)
  }
  if (!res.ok || data?.ocs?.meta?.status !== 'ok') {
    const err = data?.ocs?.data?.error ?? data?.ocs?.meta?.message ?? `Request failed: ${res.status}`
    throw new Error(err)
  }
  return data.ocs!.data as T
}

function formBody(params: Record<string, string | number>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
}

export async function getPool(): Promise<PoolInfo> {
  const res = await ncFetch(`${BASE}/pool?format=json`)
  return parseOcs<PoolInfo>(res)
}

export async function getManagedUsers(): Promise<ManagedUser[]> {
  const res = await ncFetch(`${BASE}/users?format=json`)
  const data = await parseOcs<{ users: ManagedUser[] }>(res)
  return data.users ?? []
}

export async function getMyQuota(): Promise<ManagedUser> {
  const res = await ncFetch(`${BASE}/me?format=json`)
  return parseOcs<ManagedUser>(res)
}

export async function provisionUser(payload: ProvisionUserPayload): Promise<void> {
  const res = await ncFetch(`${BASE}/provision?format=json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  await parseOcs(res)
}

export async function allocateQuota(uid: string, quotaGb: number): Promise<void> {
  const res = await ncFetch(`${BASE}/allocate/${encodeURIComponent(uid)}?format=json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody({ quota_gb: quotaGb })
  })
  await parseOcs(res)
}

export async function listRequests(): Promise<StorageRequestItem[]> {
  const res = await ncFetch(`${BASE}/requests?format=json`)
  const data = await parseOcs<{ requests: StorageRequestItem[] }>(res)
  return data.requests ?? []
}

export async function createRequest(
  currentBytes: number,
  requestedBytes: number,
  reason: string,
  storageType: StorageType = 'general'
): Promise<void> {
  const res = await ncFetch(`${BASE}/requests?format=json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody({
      current_bytes: currentBytes,
      requested_bytes: requestedBytes,
      reason,
      storage_type: storageType
    })
  })
  await parseOcs(res)
}

export async function reviewRequest(
  id: string,
  status: 'approved' | 'rejected',
  approvedBytes?: number,
  adminNotes?: string
): Promise<void> {
  const body: Record<string, string | number> = { status }
  if (approvedBytes !== undefined && approvedBytes > 0) {
    body.approved_bytes = approvedBytes
  }
  if (adminNotes?.trim()) {
    body.admin_notes = adminNotes.trim()
  }
  const res = await ncFetch(`${BASE}/requests/${encodeURIComponent(id)}?format=json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody(body)
  })
  await parseOcs(res)
}

export { GB }
