import { ncFetch, getUsername } from './nextcloud'
import type { FileItem } from '../types/files'
import { MOCK_FILES, MOCK_FOLDER_CONTENTS } from '../data/mockFiles'

function parsePropfind(xml: string): FileItem[] {
  const items: FileItem[] = []
  const responses = xml.match(/<d:response>[\s\S]*?<\/d:response>/g) ?? []
  responses.slice(1).forEach((block, i) => {
    const href = block.match(/<d:href>([^<]+)<\/d:href>/)?.[1] ?? ''
    const name = decodeURIComponent(href.split('/').filter(Boolean).pop() ?? 'unknown')
    const isCollection = block.includes('<d:collection')
    const size = parseInt(block.match(/<d:getcontentlength>(\d+)<\/d:getcontentlength>/)?.[1] ?? '0', 10)
    const modified = block.match(/<d:getlastmodified>([^<]+)<\/d:getlastmodified>/)?.[1]
    const modifiedAt = modified ? new Date(modified) : new Date()
    items.push({
      id: `nc-${i}`,
      name,
      size,
      sizeLabel: size > 0 ? `${(size / 1048576).toFixed(1)} MB` : '—',
      modifiedAt,
      modifiedLabel: modifiedAt.toLocaleDateString(),
      type: isCollection ? 'folder' : 'other',
      isFolder: isCollection,
      path: href,
      owner: ''
    })
  })
  return items
}

export async function listFiles(path = '/'): Promise<FileItem[]> {
  try {
    const username = await getUsername()
    const cleanPath = path === '/' ? '' : path
    const res = await ncFetch(`/remote.php/dav/files/${username}${cleanPath}`, {
      method: 'PROPFIND',
      headers: { Depth: '1', 'Content-Type': 'application/xml' },
      body: `<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:displayname/><d:getcontentlength/><d:getlastmodified/><d:resourcetype/></d:prop></d:propfind>`
    })
    if (!res.ok) throw new Error(`PROPFIND failed: ${res.status}`)
    const xml = await res.text()
    return parsePropfind(xml)
  } catch {
    return path === '/' ? MOCK_FILES : MOCK_FOLDER_CONTENTS[path] ?? []
  }
}

export async function downloadFile(path: string): Promise<Blob> {
  const res = await ncFetch(path)
  if (!res.ok) throw new Error('Download failed')
  return res.blob()
}

export async function uploadFile(path: string, data: Blob): Promise<void> {
  const res = await ncFetch(path, { method: 'PUT', body: data })
  if (!res.ok) throw new Error('Upload failed')
}

export async function deleteFile(path: string): Promise<void> {
  const res = await ncFetch(path, { method: 'DELETE' })
  if (!res.ok) throw new Error('Delete failed')
}

export async function moveFile(from: string, to: string): Promise<void> {
  const res = await ncFetch(from, {
    method: 'MOVE',
    headers: { Destination: to }
  })
  if (!res.ok) throw new Error('Move failed')
}

export async function createFolder(path: string): Promise<void> {
  const res = await ncFetch(path, { method: 'MKCOL' })
  if (!res.ok) throw new Error('Create folder failed')
}
