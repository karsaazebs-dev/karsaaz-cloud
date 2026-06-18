interface NextcloudConfig {
  baseUrl: string
  authToken: string
  username: string
}

let config: NextcloudConfig | null = null

const MAX_RETRIES = 2
const BASE_DELAY = 1000

async function getConfig(): Promise<NextcloudConfig> {
  if (config) return config
  const [baseUrl, authToken, username] = await Promise.all([
    window.api.store.get('serverUrl'),
    window.api.store.get('authToken'),
    window.api.store.get('username')
  ])
  if (!baseUrl || !authToken) throw new Error('NOT_AUTHENTICATED')
  config = { baseUrl: String(baseUrl).replace(/\/$/, ''), authToken: String(authToken), username: String(username ?? '') }
  return config
}

export function clearConfig(): void {
  config = null
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// All HTTP calls go through the main process (net.request) to avoid CORS restrictions
async function mainFetch(url: string, method: string, headers: Record<string, string>, body?: string): Promise<{ status: number; text: string; ok: boolean }> {
  return window.api.nc.fetch(url, method, headers, body)
}

export async function testConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const cfg = await getConfig()
    const result = await mainFetch(
      `${cfg.baseUrl}/ocs/v2.php/cloud/user?format=json`,
      'GET',
      { Authorization: `Basic ${cfg.authToken}`, 'OCS-APIREQUEST': 'true' }
    )
    if (result.status === 401) return { ok: false, error: 'Invalid credentials — please sign in again' }
    if (!result.ok) return { ok: false, error: `Server error (${result.status})` }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg === 'NOT_AUTHENTICATED') return { ok: false, error: 'Not logged in' }
    return { ok: false, error: 'Cannot reach server — check network and server URL' }
  }
}

export async function ncFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const cfg = await getConfig()

  const url = path.startsWith('http') ? path : `${cfg.baseUrl}${path}`
  const headers: Record<string, string> = {
    Authorization: `Basic ${cfg.authToken}`,
    'OCS-APIREQUEST': 'true',
    ...(options.headers as Record<string, string> ?? {})
  }
  const body = options.body != null ? String(options.body) : undefined

  let lastResult: { status: number; text: string; ok: boolean } | null = null
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await mainFetch(url, (options.method as string) ?? 'GET', headers, body)
      if (result.status === 429 || result.status === 503) {
        await sleep(BASE_DELAY * Math.pow(2, attempt))
        lastResult = result
        continue
      }
      return new Response(result.text, { status: result.status })
    } catch (err) {
      if (attempt < MAX_RETRIES - 1) await sleep(BASE_DELAY * Math.pow(2, attempt))
      else throw err
    }
  }
  return new Response(lastResult?.text ?? '', { status: lastResult?.status ?? 500 })
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    await getConfig()
    return true
  } catch {
    return false
  }
}

export async function getUsername(): Promise<string> {
  try {
    const cfg = await getConfig()
    return cfg.username
  } catch {
    return ''
  }
}
