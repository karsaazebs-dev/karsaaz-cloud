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
  let serverUrl = String(await window.api.store.get('serverUrl') ?? '').replace(/\/$/, '')
  if (serverUrl && !serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
    serverUrl = 'http://' + serverUrl
  }
  if (!serverUrl) return url
  try {
    const parsed = new URL(url)
    const server = new URL(serverUrl)
    
    // If Nextcloud returned an internal docker hostname (like collabora), map it to the Nextcloud host IP
    if (parsed.hostname === 'collabora' || parsed.hostname === 'localhost') {
      parsed.hostname = server.hostname
      // Keep parsed.port as 9980 (or whatever it is), only change the hostname
      return parsed.toString()
    }
  } catch {
    // keep original on parse error
  }
  return url
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
  let json: unknown
  try {
    json = await ocsPost('/ocs/v2.php/apps/richdocuments/api/v1/document?format=json', { fileId })
  } catch (err) {
    throw new Error('Nextcloud Office WOPI host is not configured on the server. Please install and enable the richdocuments app.')
  }
  
  let data: { url: string } | undefined
  try {
    data = parseOcs<{ url: string }>(json)
  } catch (err) {
    throw new Error('Nextcloud Office WOPI host is not configured on the server. Please install and enable the richdocuments app.')
  }
  
  if (!data?.url) throw new Error('No editor URL returned')
  return normalizeEditorUrl(data.url)
}

function getEmptyTemplateBase64(type: OfficeTemplateType): string {
  if (type === 'spreadsheet') {
    return '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'
  }
  if (type === 'presentation') {
    return 'UEsDBBQABgAIAAAAIQAAAAAAAAAAAAAAAAAAAA==' // minimal placeholder for presentation
  }
  // document
  return 'UEsDBBQABgAIAAAAIQAAAAAAAAAAAAAAAAAAAA==' // minimal placeholder for document
}

export async function createOfficeDocument(
  folderPath: string,
  type: OfficeTemplateType,
  title: string
): Promise<string> {
  let fallbackNeeded = false
  let templateId: number | null = null

  try {
    const templatesRes = await ncFetch(
      `/ocs/v2.php/apps/richdocuments/api/v1/templates/${type}?format=json`
    )
    if (!templatesRes.ok) {
      fallbackNeeded = true
    } else {
      const templates = parseOcs<Array<{ id: number; name: string }>>(await templatesRes.json())
      templateId = templates?.[0]?.id ?? null
      if (!templateId) fallbackNeeded = true
    }
  } catch (err) {
    fallbackNeeded = true
  }

  const safeName = title.trim() || `New ${type}`
  const ext = OFFICE_EXT[type]
  const dir = folderPath === '/' ? '' : folderPath
  const path = `${dir}/${safeName}.${ext}`.replace(/\/+/g, '/')

  if (fallbackNeeded) {
    // Generate empty document via WebDAV if templates API is missing
    const base64Str = getEmptyTemplateBase64(type)
    const buffer = Uint8Array.from(atob(base64Str), c => c.charCodeAt(0))
    const res = await window.api.nc.upload(dir, `${safeName}.${ext}`, buffer.buffer)
    
    if (!res.ok) throw new Error('Could not create document via fallback: ' + res.error)
    
    // We created the file, but we can't get the WOPI URL because richdocuments is missing!
    throw new Error(`The file ${safeName}.${ext} was created, but Nextcloud Office (richdocuments app) is not installed on the server. You cannot edit it.`)
  }

  const json = await ocsPost('/ocs/v2.php/apps/richdocuments/api/v1/templates/new?format=json', {
    path,
    template: String(templateId)
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
