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

export function parsePropfind(xml: string, remoteRoot: string): RemoteEntry[] {
  const entries: RemoteEntry[] = []
  const root = remoteRoot === '/' ? '' : remoteRoot.replace(/\/$/, '')
  const responses = xml.match(/<d:response>[\s\S]*?<\/d:response>/g) ?? []

  for (const block of responses) {
    const href = block.match(/<d:href>([^<]+)<\/d:href>/)?.[1] ?? ''
    let path = href
    try {
      if (path.startsWith('http')) path = new URL(path).pathname
    } catch { /* keep */ }
    path = decodeURIComponent(path)
    const davIdx = path.indexOf('/remote.php/dav/files/')
    if (davIdx < 0) continue
    const afterUser = path.slice(davIdx).split('/').slice(4).join('/')
    const userRel = afterUser ? `/${afterUser}` : '/'
    if (userRel === root || userRel === `${root}/`) continue

    const isDir = block.includes('<d:collection')
    if (!userRel.startsWith(root === '' ? '/' : root)) continue
    const rel = root ? userRel.slice(root.length).replace(/^\//, '') : userRel.replace(/^\//, '')
    if (!rel || rel.endsWith('/')) continue

    const size = parseInt(block.match(/<d:getcontentlength>(\d+)<\/d:getcontentlength>/)?.[1] ?? '0', 10)
    const modified = block.match(/<d:getlastmodified>([^<]+)<\/d:getlastmodified>/)?.[1]
    const mtimeMs = modified ? Date.parse(modified) : 0
    entries.push({ rel, size, mtimeMs, isDir })
  }
  return entries.filter((e) => !e.isDir)
}
