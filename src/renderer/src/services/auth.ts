export interface ServerInfo {
  version: string
  edition: string
  ssl: boolean
}

export async function detectServer(url: string): Promise<ServerInfo | null> {
  try {
    const cleanUrl = url.replace(/\/$/, '')
    const result = await window.api.nc.fetch(`${cleanUrl}/status.php`, 'GET', {})
    if (!result.ok) return null
    const data = JSON.parse(result.text)
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
): Promise<{ token: string } | { error: string }> {
  try {
    const cleanUrl = serverUrl.replace(/\/$/, '')
    const credentials = btoa(`${username}:${password}`)
    const result = await window.api.nc.fetch(
      `${cleanUrl}/ocs/v2.php/cloud/user?format=json`,
      'GET',
      { Authorization: `Basic ${credentials}`, 'OCS-APIREQUEST': 'true' }
    )
    if (result.status === 401) return { error: 'Invalid credentials. Please try again.' }
    if (!result.ok) return { error: `Server error (${result.status}). Try again.` }
    return { token: credentials }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { error: `Cannot reach server: ${msg}` }
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
