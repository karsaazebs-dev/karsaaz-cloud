import { net } from 'electron'

export const DAV_UA = 'Karsaaz-Sync/1.0.0 (Windows)'

export const PROPFIND_BODY = `<?xml version="1.0"?>
<d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
  <d:prop>
    <d:getcontentlength/><d:getlastmodified/><d:resourcetype/>
  </d:prop>
</d:propfind>`

export interface DavAuth {
  serverUrl: string
  authToken: string
  username: string
}

export function buildDavUrl(serverUrl: string, username: string, userPath: string): string {
  const base = serverUrl.replace(/\/$/, '')
  const segments = userPath.split('/').filter(Boolean).map((s) => encodeURIComponent(s))
  const suffix = segments.length ? `/${segments.join('/')}` : ''
  return `${base}/remote.php/dav/files/${encodeURIComponent(username)}${suffix}`
}

export function davRequest(
  method: string,
  url: string,
  authToken: string,
  body?: Buffer,
  extraHeaders: Record<string, string> = {}
): Promise<{ status: number; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const req = net.request({ url, method })
    req.setHeader('Authorization', `Basic ${authToken}`)
    req.setHeader('OCS-APIREQUEST', 'true')
    req.setHeader('User-Agent', DAV_UA)
    for (const [k, v] of Object.entries(extraHeaders)) req.setHeader(k, v)
    const chunks: Buffer[] = []
    req.on('response', (res) => {
      res.on('data', (c: Buffer) => chunks.push(c))
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks) }))
      res.on('error', reject)
    })
    req.on('error', reject)
    if (body) req.end(body)
    else req.end()
  })
}

export interface RemoteEntry {
  rel: string
  size: number
  mtimeMs: number
  isDir: boolean
}

const DAV_PREFIX = '/remote.php/dav/files/'

export function davHrefToUserPath(href: string, username: string): string | null {
  let path = href
  try {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      path = new URL(path).pathname
    }
  } catch {
    // keep original
  }
  path = decodeURIComponent(path)
  const userPrefix = `${DAV_PREFIX}${username}/`
  const userIdx = path.indexOf(userPrefix)
  if (userIdx >= 0) {
    const rest = path.slice(userIdx + userPrefix.length)
    return rest ? `/${rest}` : '/'
  }
  const davIdx = path.indexOf(DAV_PREFIX)
  if (davIdx < 0) return null
  const afterDav = path.slice(davIdx + DAV_PREFIX.length)
  const slash = afterDav.indexOf('/')
  if (slash < 0) return '/'
  const rest = afterDav.slice(slash + 1)
  return rest ? `/${rest}` : '/'
}

export function parsePropfind(xml: string, remoteRoot: string, username: string): RemoteEntry[] {
  const entries: RemoteEntry[] = []
  const root = remoteRoot === '/' ? '' : remoteRoot.replace(/\/$/, '')
  const responses = xml.match(/<d:response>[\s\S]*?<\/d:response>/g) ?? []

  for (const block of responses) {
    const href = block.match(/<d:href>([^<]+)<\/d:href>/)?.[1] ?? ''
    const userRel = davHrefToUserPath(href, username)
    if (!userRel || userRel === '/' || userRel === root || userRel === `${root}/`) continue

    const isDir = /<d:collection[\s/>]/.test(block)
    const rootPrefix = root === '' ? '/' : root
    if (!userRel.startsWith(rootPrefix)) continue
    const rel = root ? userRel.slice(root.length).replace(/^\//, '') : userRel.replace(/^\//, '')
    if (!rel || rel.endsWith('/')) continue

    const size = parseInt(block.match(/<d:getcontentlength>(\d+)<\/d:getcontentlength>/)?.[1] ?? '0', 10)
    const modified = block.match(/<d:getlastmodified>([^<]+)<\/d:getlastmodified>/)?.[1]
    const mtimeMs = modified ? Date.parse(modified) : 0
    entries.push({ rel, size, mtimeMs, isDir })
  }
  return entries.filter((e) => !e.isDir)
}
