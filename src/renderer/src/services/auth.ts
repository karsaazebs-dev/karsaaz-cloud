export interface ServerInfo {
  version: string
  edition: string
  ssl: boolean
}

export async function detectServer(url: string): Promise<ServerInfo | null> {
  try {
    const cleanUrl = url.replace(/\/$/, '')
    const res = await fetch(`${cleanUrl}/status.php`)
    if (!res.ok) return null
    const data = await res.json()
    return {
      version: data.version || 'Unknown',
      edition: data.edition || 'Community',
      ssl: cleanUrl.startsWith('https://')
    }
  } catch {
    return null
  }
}

export async function loginWithCredentials(
  serverUrl: string,
  username: string,
  password: string
): Promise<{ token: string } | null> {
  try {
    const cleanUrl = serverUrl.replace(/\/$/, '')
    const credentials = btoa(`${username}:${password}`)
    const res = await fetch(`${cleanUrl}/ocs/v2.php/cloud/user?format=json`, {
      headers: {
        Authorization: `Basic ${credentials}`,
        'OCS-APIREQUEST': 'true'
      }
    })
    if (!res.ok) return null
    return { token: credentials }
  } catch {
    return null
  }
}

export async function logout(): Promise<void> {
  await window.api.store.delete('authToken')
  await window.api.store.delete('serverUrl')
  await window.api.store.delete('username')
}

export async function getRecentServers(): Promise<string[]> {
  const servers = (await window.api.store.get('recentServers')) as string[] | undefined
  return servers ?? []
}

export async function saveRecentServer(url: string): Promise<void> {
  const servers = await getRecentServers()
  const filtered = servers.filter((s) => s !== url)
  const updated = [url, ...filtered].slice(0, 5)
  await window.api.store.set('recentServers', updated)
}
