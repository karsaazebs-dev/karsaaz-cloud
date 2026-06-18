import { ncFetch, getUsername } from './nextcloud'
import { davHrefToUserPath, normalizeDavHref, resolveDavHref, userPathToAbsoluteUrl, userPathToDavHref } from '../utils/davPaths'
import { applyPinnedState } from './pinnedFiles'
import type { FileItem, FileType } from '../types/files'

const PROPFIND_BODY = `<?xml version="1.0"?>
<d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:nc="http://nextcloud.org/ns">
  <d:prop>
    <d:displayname/><d:getcontentlength/><d:getlastmodified/>
    <d:resourcetype/><oc:fileid/><oc:favorite/><oc:owner-id/>
  </d:prop>
</d:propfind>`

function extToType(name: string): FileType {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic'].includes(ext)) return 'image'
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'].includes(ext)) return 'video'
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'].includes(ext)) return 'document'
  return 'other'
}

function fmtSize(b: number): string {
  if (b >= 1073741824) return `${(b / 1073741824).toFixed(1)} GB`
  if (b >= 1048576) return `${(b / 1048576).toFixed(1)} MB`
  if (b >= 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${b} B`
}

function fmtDate(d: Date): string {
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function parsePropfind(xml: string, serverUrl: string, username: string): FileItem[] {
  const items: FileItem[] = []
  const responses = xml.match(/<d:response>[\s\S]*?<\/d:response>/g) ?? []
  responses.slice(1).forEach((block) => {
    const href = block.match(/<d:href>([^<]+)<\/d:href>/)?.[1] ?? ''
    const userPath = davHrefToUserPath(href, username)
    if (!userPath || userPath === '/') return

    const displayName = block.match(/<d:displayname>([^<]*)<\/d:displayname>/)?.[1]
    const name = displayName
      ? decodeURIComponent(displayName)
      : userPath.split('/').filter(Boolean).pop() ?? 'unknown'
    const isCollection = /<d:collection[\s/>]/.test(block)
    const size = parseInt(block.match(/<d:getcontentlength>(\d+)<\/d:getcontentlength>/)?.[1] ?? '0', 10)
    const modified = block.match(/<d:getlastmodified>([^<]+)<\/d:getlastmodified>/)?.[1]
    const modifiedAt = modified ? new Date(modified) : new Date()
    const fileId = block.match(/<oc:fileid>([^<]+)<\/oc:fileid>/)?.[1] ?? ''
    const favourite = block.includes('<oc:favorite>1</oc:favorite>')
    const ownerId = block.match(/<oc:owner-id>([^<]+)<\/oc:owner-id>/)?.[1] ?? ''
    const type: FileType = isCollection ? 'folder' : extToType(name)
    const thumbnail = fileId && !isCollection
      ? `${serverUrl}/index.php/core/preview?fileId=${fileId}&x=256&y=256&forceIcon=0`
      : undefined
    const parentPath = userPath.lastIndexOf('/') > 0
      ? userPath.slice(0, userPath.lastIndexOf('/')) || '/'
      : '/'
    items.push({
      id: fileId || `nc-${userPath}`,
      name,
      size,
      sizeLabel: size > 0 ? fmtSize(size) : '—',
      modifiedAt,
      modifiedLabel: fmtDate(modifiedAt),
      type,
      isFolder: isCollection,
      path: userPath,
      parentPath,
      owner: ownerId,
      favourite,
      thumbnail
    })
  })
  return items
}

export async function listFiles(path = '/'): Promise<FileItem[]> {
  try {
    const username = await getUsername()
    const serverUrl = ((await window.api.store.get('serverUrl')) as string ?? '').replace(/\/$/, '')
    const href = await userPathToDavHref(path)
    const res = await ncFetch(href, {
      method: 'PROPFIND',
      headers: { Depth: '1', 'Content-Type': 'application/xml' },
      body: PROPFIND_BODY
    })
    if (!res.ok) throw new Error(`PROPFIND failed: ${res.status}`)
    const xml = await res.text()
    return applyPinnedState(parsePropfind(xml, serverUrl, username))
  } catch {
    return []
  }
}

export async function listFavouriteFiles(): Promise<FileItem[]> {
  try {
    const username = await getUsername()
    const serverUrl = ((await window.api.store.get('serverUrl')) as string ?? '').replace(/\/$/, '')
    const res = await ncFetch(`/remote.php/dav/files/${username}`, {
      method: 'REPORT',
      headers: { Depth: '0', 'Content-Type': 'application/xml' },
      body: `<?xml version="1.0"?>
<oc:filter-files xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
  <d:prop><d:displayname/><d:getcontentlength/><d:getlastmodified/><d:resourcetype/><oc:fileid/><oc:favorite/><oc:owner-id/></d:prop>
  <oc:filter-rules><oc:favorite>1</oc:favorite></oc:filter-rules>
</oc:filter-files>`
    })
    if (!res.ok) throw new Error('Favourites fetch failed')
    const xml = await res.text()
    return applyPinnedState(parsePropfind(xml, serverUrl, username))
  } catch {
    return []
  }
}

export async function listSharedWithMe(): Promise<FileItem[]> {
  try {
    const res = await ncFetch('/ocs/v2.php/apps/files_sharing/api/v1/shares?format=json&shared_with_me=true')
    if (!res.ok) throw new Error('Shares fetch failed')
    const data = await res.json()
    const shares: FileItem[] = (data?.ocs?.data ?? []).map((s: Record<string, unknown>, i: number) => {
      const name = String(s.file_target ?? s.path ?? 'Shared file').split('/').pop() ?? 'Shared file'
      const size = Number(s.item_size ?? 0)
      const modifiedAt = new Date(Number(s.stime ?? Date.now() / 1000) * 1000)
      return {
        id: `share-${s.id ?? i}`,
        name,
        size,
        sizeLabel: size > 0 ? fmtSize(size) : '—',
        modifiedAt,
        modifiedLabel: fmtDate(modifiedAt),
        type: extToType(name) as FileType,
        isFolder: s.item_type === 'folder',
        path: String(s.file_target ?? '/'),
        owner: String(s.uid_owner ?? ''),
        shared: true,
        sharedBy: String(s.displayname_owner ?? s.uid_owner ?? '')
      }
    })
    return applyPinnedState(shares)
  } catch {
    return []
  }
}

export async function listTrashbinFiles(): Promise<Array<{ id: string; name: string; size: number; sizeLabel: string; deletedAt: Date; originalLocation: string }>> {
  try {
    const username = await getUsername()
    const res = await ncFetch(`/remote.php/dav/trashbin/${username}/trash`, {
      method: 'PROPFIND',
      headers: { Depth: '1', 'Content-Type': 'application/xml' },
      body: `<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:nc="http://nextcloud.org/ns"><d:prop><d:displayname/><d:getcontentlength/><nc:trashbin-filename/><nc:trashbin-deletion-time/><nc:trashbin-original-location/></d:prop></d:propfind>`
    })
    if (!res.ok) throw new Error('Trashbin fetch failed')
    const xml = await res.text()
    const responses = xml.match(/<d:response>[\s\S]*?<\/d:response>/g) ?? []
    return responses.slice(1).map((block, i) => {
      const href = block.match(/<d:href>([^<]+)<\/d:href>/)?.[1] ?? ''
      const id = href.split('/').pop() ?? `trash-${i}`
      const name = block.match(/<nc:trashbin-filename>([^<]+)<\/nc:trashbin-filename>/)?.[1] ??
        block.match(/<d:displayname>([^<]+)<\/d:displayname>/)?.[1] ?? 'Unknown'
      const size = parseInt(block.match(/<d:getcontentlength>(\d+)<\/d:getcontentlength>/)?.[1] ?? '0', 10)
      const deletionTime = parseInt(block.match(/<nc:trashbin-deletion-time>(\d+)<\/nc:trashbin-deletion-time>/)?.[1] ?? '0', 10)
      const deletedAt = deletionTime ? new Date(deletionTime * 1000) : new Date()
      const originalLocation = block.match(/<nc:trashbin-original-location>([^<]+)<\/nc:trashbin-original-location>/)?.[1] ?? '/'
      return { id, name, size, sizeLabel: size > 0 ? fmtSize(size) : '—', deletedAt, originalLocation }
    })
  } catch {
    return []
  }
}

export async function restoreTrashbinFile(id: string): Promise<void> {
  const username = await getUsername()
  const res = await ncFetch(`/remote.php/dav/trashbin/${username}/trash/${id}`, {
    method: 'MOVE',
    headers: { Destination: `/remote.php/dav/trashbin/${username}/restore/${id}` }
  })
  if (!res.ok) throw new Error('Restore failed')
}

export async function deleteTrashbinFile(id: string): Promise<void> {
  const username = await getUsername()
  const res = await ncFetch(`/remote.php/dav/trashbin/${username}/trash/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Permanent delete failed')
}

export async function emptyTrashbin(): Promise<void> {
  const username = await getUsername()
  const res = await ncFetch(`/remote.php/dav/trashbin/${username}/trash`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Empty trash failed')
}

export async function toggleFavourite(path: string, favourite: boolean): Promise<void> {
  const href = path.includes('/remote.php/dav/') ? normalizeDavHref(path) : await resolveDavHref(path)
  const res = await ncFetch(href, {
    method: 'PROPPATCH',
    headers: { 'Content-Type': 'application/xml' },
    body: `<?xml version="1.0"?><d:propertyupdate xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns"><d:set><d:prop><oc:favorite>${favourite ? 1 : 0}</oc:favorite></d:prop></d:set></d:propertyupdate>`
  })
  if (!res.ok) throw new Error('Toggle favourite failed')
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
  const href = path.includes('/remote.php/dav/') ? normalizeDavHref(path) : await resolveDavHref(path)
  const res = await ncFetch(href, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) throw new Error(`Delete failed: ${res.status}`)
}

export async function moveFile(fromDavHref: string, toUserPath: string): Promise<void> {
  const source = normalizeDavHref(fromDavHref)
  const destUrl = await userPathToAbsoluteUrl(toUserPath)
  const res = await ncFetch(source, {
    method: 'MOVE',
    headers: { Destination: destUrl, Overwrite: 'T' }
  })
  if (!res.ok && res.status !== 201 && res.status !== 204) {
    throw new Error(`Move failed: ${res.status}`)
  }
}

export async function createFolder(path: string): Promise<void> {
  const href = await userPathToDavHref(path)
  const res = await ncFetch(href, { method: 'MKCOL' })
  if (!res.ok) throw new Error('Create folder failed')
}
