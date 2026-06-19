import { ncFetch } from './nextcloud'

export type OfficeTemplateType = 'document' | 'spreadsheet' | 'presentation'

const OFFICE_EXT: Record<OfficeTemplateType, string> = {
  document: 'docx',
  spreadsheet: 'xlsx',
  presentation: 'pptx'
}

const OFFICE_EDIT_EXT = new Set([
  'doc', 'docx', 'odt', 'rtf',
  'xls', 'xlsx', 'ods', 'csv',
  'ppt', 'pptx', 'odp'
])

interface OcsResponse<T> {
  ocs?: { meta?: { status?: string }; data?: T }
}

function parseOcs<T>(json: unknown): T {
  const body = json as OcsResponse<T>
  if (body.ocs?.meta?.status === 'failure') {
    throw new Error('Office API request failed')
  }
  return body.ocs?.data as T
}

export function isOfficeEditableName(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return OFFICE_EDIT_EXT.has(ext)
}

export function isOfficeFileId(id: string): boolean {
  return /^\d+$/.test(id)
}

export async function normalizeEditorUrl(url: string): Promise<string> {
  const serverUrl = String(await window.api.store.get('serverUrl') ?? '').replace(/\/$/, '')
  if (!serverUrl) return url
  try {
    const parsed = new URL(url)
    const server = new URL(serverUrl)
    if (parsed.host !== server.host) {
      parsed.protocol = server.protocol
      parsed.host = server.host
      return parsed.toString()
    }
  } catch {
    // keep original
  }
  return url.replace(/https?:\/\/collabora:9980/g, 'http://localhost:9980')
}

async function ocsPost(path: string, params: Record<string, string>): Promise<unknown> {
  const body = new URLSearchParams(params).toString()
  const res = await ncFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
  if (!res.ok) throw new Error(`Office API error (${res.status})`)
  return res.json()
}

export async function openDocumentEditor(fileId: string): Promise<string> {
  const json = await ocsPost('/ocs/v2.php/apps/richdocuments/api/v1/document?format=json', { fileId })
  const data = parseOcs<{ url: string }>(json)
  if (!data?.url) throw new Error('No editor URL returned')
  return normalizeEditorUrl(data.url)
}

export async function createOfficeDocument(
  folderPath: string,
  type: OfficeTemplateType,
  title: string
): Promise<string> {
  const templatesRes = await ncFetch(
    `/ocs/v2.php/apps/richdocuments/api/v1/templates/${type}?format=json`
  )
  if (!templatesRes.ok) throw new Error('Could not load document templates')
  const templates = parseOcs<Array<{ id: number; name: string }>>(await templatesRes.json())
  const template = templates?.[0]?.id
  if (!template) throw new Error('No template available for this document type')

  const safeName = title.trim() || `New ${type}`
  const ext = OFFICE_EXT[type]
  const dir = folderPath === '/' ? '' : folderPath
  const path = `${dir}/${safeName}.${ext}`.replace(/\/+/g, '/')

  const json = await ocsPost('/ocs/v2.php/apps/richdocuments/api/v1/templates/new?format=json', {
    path,
    template: String(template)
  })
  const data = parseOcs<{ url: string }>(json)
  if (!data?.url) throw new Error('Could not create document')
  return normalizeEditorUrl(data.url)
}

export async function createTextDocument(folderPath: string, title: string): Promise<void> {
  const safeName = title.trim() || 'New Text Document'
  const body = new TextEncoder().encode('').buffer
  const res = await window.api.nc.upload(folderPath, `${safeName}.txt`, body)
  if (!res.ok) throw new Error(res.error ?? 'Could not create text file')
}

export async function isOfficeAvailable(): Promise<boolean> {
  try {
    const res = await ncFetch('/ocs/v2.php/cloud/capabilities?format=json')
    if (!res.ok) return false
    const json = await res.json()
    const caps = json?.ocs?.data?.capabilities
    return Boolean(caps?.richdocuments?.version || caps?.richdocuments)
  } catch {
    return false
  }
}
