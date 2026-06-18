import { getUsername } from '../services/nextcloud'

const DAV_PREFIX = '/remote.php/dav/files/'

function encodeSegments(userPath: string): string {
  if (userPath === '/' || userPath === '') return ''
  return '/' + userPath.split('/').filter(Boolean).map(encodeURIComponent).join('/')
}

export function davHrefToUserPath(href: string, username: string): string {
  let path = href
  try {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      path = new URL(path).pathname
    }
  } catch {
    // keep original
  }
  path = decodeURIComponent(path)
  const encodedPrefix = `${DAV_PREFIX}${username}`
  const idx = path.indexOf(encodedPrefix)
  if (idx >= 0) {
    path = path.slice(idx + encodedPrefix.length)
  } else if (path.includes(DAV_PREFIX)) {
    const parts = path.split(DAV_PREFIX)[1] ?? ''
    path = parts.includes('/') ? parts.split('/').slice(1).join('/') : parts
  }
  if (!path.startsWith('/')) path = `/${path}`
  return path === '' ? '/' : path
}

export function normalizeDavHref(href: string): string {
  let path = href
  try {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      path = new URL(path).pathname
    }
  } catch {
    // keep original
  }
  if (!path.startsWith('/')) path = `/${path}`
  return path
}

export async function userPathToDavHref(userPath: string): Promise<string> {
  const username = await getUsername()
  return `${DAV_PREFIX}${encodeURIComponent(username)}${encodeSegments(userPath)}`
}

export async function userPathToAbsoluteUrl(userPath: string): Promise<string> {
  const serverUrl = String(await window.api.store.get('serverUrl') ?? '').replace(/\/$/, '')
  const href = await userPathToDavHref(userPath)
  return `${serverUrl}${href}`
}

export async function resolveDavHref(path: string): Promise<string> {
  if (path.includes('/remote.php/dav/')) return normalizeDavHref(path)
  const userPath = path.startsWith('/') ? path : `/${path}`
  return userPathToDavHref(userPath)
}
