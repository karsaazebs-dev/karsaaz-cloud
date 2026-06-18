import { ncFetch } from './nextcloud'
import { userPathToDavHref } from '../utils/davPaths'

export interface SystemTag {
  id: string
  name: string
}

const TAGS_PROPFIND = `<?xml version="1.0"?>
<d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
  <d:prop><oc:id /><oc:display-name /><oc:user-visible /><oc:user-assignable /></d:prop>
</d:propfind>`

const FILE_TAGS_PROPFIND = `<?xml version="1.0"?>
<d:propfind xmlns:d="DAV:" xmlns:nc="http://nextcloud.org/ns">
  <d:prop><nc:system-tags /></d:prop>
</d:propfind>`

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function parseTagList(xml: string): SystemTag[] {
  const tags: SystemTag[] = []
  const blocks = xml.match(/<d:response>[\s\S]*?<\/d:response>/g) ?? []
  blocks.forEach((block) => {
    const id = block.match(/<oc:id>(\d+)<\/oc:id>/)?.[1]
    const name = block.match(/<oc:display-name>([^<]*)<\/oc:display-name>/)?.[1]
    if (id && name) tags.push({ id, name: decodeURIComponent(name) })
  })
  return tags
}

function parseFileTags(xml: string): string[] {
  const tags: string[] = []
  const matches = xml.matchAll(/<nc:system-tag[^>]*>([^<]*)<\/nc:system-tag>/g)
  for (const m of matches) {
    if (m[1]) tags.push(decodeURIComponent(m[1]))
  }
  return tags
}

function encodeFileApiPath(userPath: string): string {
  if (userPath === '/') return ''
  return userPath.split('/').map((seg) => (seg ? encodeURIComponent(seg) : '')).join('/')
}

export async function listSystemTags(): Promise<SystemTag[]> {
  const res = await ncFetch('/remote.php/dav/systemtags', {
    method: 'PROPFIND',
    headers: { Depth: '1', 'Content-Type': 'application/xml' },
    body: TAGS_PROPFIND
  })
  if (!res.ok) return []
  return parseTagList(await res.text())
}

export async function createSystemTag(name: string): Promise<SystemTag> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Tag name is required')

  const body = `<?xml version="1.0"?>
<d:propertyupdate xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
  <d:set><d:prop>
    <oc:display-name>${escapeXml(trimmed)}</oc:display-name>
    <oc:user-visible>true</oc:user-visible>
    <oc:user-assignable>true</oc:user-assignable>
  </d:prop></d:set>
</d:propertyupdate>`

  const res = await ncFetch('/remote.php/dav/systemtags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml' },
    body
  })
  if (!res.ok && res.status !== 201) throw new Error(`Create tag failed: ${res.status}`)

  const tags = await listSystemTags()
  const found = tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase())
  if (!found) throw new Error('Tag created but could not be loaded')
  return found
}

export async function getFileTags(userPath: string): Promise<string[]> {
  const href = await userPathToDavHref(userPath)
  const res = await ncFetch(href, {
    method: 'PROPFIND',
    headers: { Depth: '0', 'Content-Type': 'application/xml' },
    body: FILE_TAGS_PROPFIND
  })
  if (!res.ok) return []
  return parseFileTags(await res.text())
}

export async function addTagToFile(userPath: string, tagName: string): Promise<void> {
  const trimmed = tagName.trim()
  if (!trimmed) throw new Error('Tag name is required')

  const existing = await listSystemTags()
  let tag = existing.find((t) => t.name.toLowerCase() === trimmed.toLowerCase())
  if (!tag) tag = await createSystemTag(trimmed)

  const current = await getFileTags(userPath)
  if (current.includes(tag.name)) return

  const res = await ncFetch(`/index.php/apps/files/api/v1/files${encodeFileApiPath(userPath)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags: [...current, tag.name] })
  })
  if (!res.ok) throw new Error(`Assign tag failed: ${res.status}`)
}

export async function getOrCreateTag(name: string): Promise<SystemTag> {
  const trimmed = name.trim()
  const existing = await listSystemTags()
  const found = existing.find((t) => t.name.toLowerCase() === trimmed.toLowerCase())
  if (found) return found
  return createSystemTag(trimmed)
}
