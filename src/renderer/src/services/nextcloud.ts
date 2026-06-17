interface NextcloudConfig {
  baseUrl: string
  authToken: string
  username: string
}

let config: NextcloudConfig | null = null

const MAX_RETRIES = 3
const BASE_DELAY = 1000

async function getConfig(): Promise<NextcloudConfig | null> {
  if (config) return config
  const [baseUrl, authToken, username] = await Promise.all([
    window.api.store.get('serverUrl'),
    window.api.store.get('authToken'),
    window.api.store.get('username')
  ])
  if (!baseUrl || !authToken) return null
  config = { baseUrl: String(baseUrl).replace(/\/$/, ''), authToken: String(authToken), username: String(username ?? '') }
  return config
}

export function clearConfig(): void {
  config = null
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function ncFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const cfg = await getConfig()
  if (!cfg) throw new Error('Not authenticated')

  const url = path.startsWith('http') ? path : `${cfg.baseUrl}${path}`
  const headers: Record<string, string> = {
    Authorization: `Basic ${cfg.authToken}`,
    'OCS-APIREQUEST': 'true',
    'User-Agent': 'Karsaaz-Sync/1.0.0 (Windows)',
    ...(options.headers as Record<string, string> ?? {})
  }

  let lastError: Error | null = null
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { ...options, headers })
      if (res.status === 429 || res.status === 503) {
        await sleep(BASE_DELAY * Math.pow(2, attempt))
        continue
      }
      return res
    } catch (err) {
      lastError = err as Error
      await sleep(BASE_DELAY * Math.pow(2, attempt))
    }
  }
  throw lastError ?? new Error('Request failed after retries')
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getConfig()) !== null
}

export async function getUsername(): Promise<string> {
  const cfg = await getConfig()
  return cfg?.username ?? ''
}
