import { watch, type FSWatcher, existsSync } from 'fs'
import { readdir, stat, readFile, writeFile, mkdir } from 'fs/promises'
import { join, relative, dirname } from 'path'
import { shell, type BrowserWindow } from 'electron'
import type Store from 'electron-store'
import { buildDavUrl, davRequest, parsePropfind, PROPFIND_BODY, type DavAuth } from './dav'

export interface SyncFolderRecord {
  id: string
  localPath: string
  remotePath: string
  status: 'synced' | 'syncing' | 'error' | 'paused'
  lastSynced?: string
  error?: string
}

type GetWindow = () => BrowserWindow | null
type GetAuth = () => DavAuth | null

export function createSyncEngine(store: Store, getWindow: GetWindow, getAuth: GetAuth) {
  const watchers = new Map<string, FSWatcher>()
  const debounce = new Map<string, ReturnType<typeof setTimeout>>()
  let pollTimer: ReturnType<typeof setInterval> | null = null
  const syncing = new Set<string>()

  function list(): SyncFolderRecord[] {
    return store.get('syncFolders', []) as SyncFolderRecord[]
  }

  function save(next: SyncFolderRecord[]): void {
    store.set('syncFolders', next)
    getWindow()?.webContents.send('sync:folders-updated')
  }

  function patch(id: string, update: Partial<SyncFolderRecord>): void {
    save(list().map((f) => (f.id === id ? { ...f, ...update } : f)))
  }

  async function walkLocal(root: string): Promise<Array<{ rel: string; full: string; mtimeMs: number }>> {
    const out: Array<{ rel: string; full: string; mtimeMs: number }> = []
    async function walk(dir: string): Promise<void> {
      const entries = await readdir(dir, { withFileTypes: true })
      for (const ent of entries) {
        if (ent.name.startsWith('.')) continue
        const full = join(dir, ent.name)
        if (ent.isDirectory()) await walk(full)
        else if (ent.isFile()) {
          const st = await stat(full)
          out.push({ rel: relative(root, full).replace(/\\/g, '/'), full, mtimeMs: st.mtimeMs })
        }
      }
    }
    await walk(root)
    return out
  }

  async function ensureRemoteDirs(auth: DavAuth, remoteRoot: string, relPath: string): Promise<void> {
    const parts = relPath.split('/').filter(Boolean).slice(0, -1)
    let acc = remoteRoot === '/' ? '' : remoteRoot
    for (const part of parts) {
      acc = acc ? `${acc}/${part}` : `/${part}`
      const url = buildDavUrl(auth.serverUrl, auth.username, acc)
      const res = await davRequest('MKCOL', url, auth.authToken)
      if (res.status !== 201 && res.status !== 405 && res.status !== 409 && res.status !== 200) {
        throw new Error(`Could not create remote folder (HTTP ${res.status})`)
      }
    }
  }

  async function uploadFile(auth: DavAuth, remoteRoot: string, rel: string, localFull: string): Promise<void> {
    await ensureRemoteDirs(auth, remoteRoot, rel)
    const remotePath = remoteRoot === '/'
      ? `/${rel}`
      : `${remoteRoot.replace(/\/$/, '')}/${rel}`
    const url = buildDavUrl(auth.serverUrl, auth.username, remotePath)
    const data = await readFile(localFull)
    const res = await davRequest('PUT', url, auth.authToken, data, { 'Content-Type': 'application/octet-stream' })
    if (res.status < 200 || res.status >= 300) throw new Error(`Upload failed (HTTP ${res.status})`)
  }

  async function downloadFile(auth: DavAuth, remoteRoot: string, rel: string, localRoot: string): Promise<void> {
    const remotePath = remoteRoot === '/'
      ? `/${rel}`
      : `${remoteRoot.replace(/\/$/, '')}/${rel}`
    const url = buildDavUrl(auth.serverUrl, auth.username, remotePath)
    const res = await davRequest('GET', url, auth.authToken)
    if (res.status < 200 || res.status >= 300) throw new Error(`Download failed (HTTP ${res.status})`)
    const dest = join(localRoot, rel)
    await mkdir(dirname(dest), { recursive: true })
    await writeFile(dest, res.body)
  }

  async function listRemote(auth: DavAuth, remoteRoot: string) {
    const url = buildDavUrl(auth.serverUrl, auth.username, remoteRoot)
    const res = await davRequest('PROPFIND', url, auth.authToken, Buffer.from(PROPFIND_BODY), {
      Depth: 'infinity',
      'Content-Type': 'application/xml'
    })
    if (res.status < 200 || res.status >= 300) throw new Error(`Remote listing failed (HTTP ${res.status})`)
    return parsePropfind(res.body.toString('utf8'), remoteRoot)
  }

  async function syncFolder(id: string): Promise<void> {
    if (syncing.has(id)) return
    const folder = list().find((f) => f.id === id)
    if (!folder || folder.status === 'paused') return

    const auth = getAuth()
    if (!auth) {
      patch(id, { status: 'error', error: 'Not authenticated — sign in again' })
      return
    }
    if (!existsSync(folder.localPath)) {
      patch(id, { status: 'error', error: 'Local folder not found' })
      return
    }

    syncing.add(id)
    patch(id, { status: 'syncing', error: undefined })

    try {
      const remoteRoot = folder.remotePath.startsWith('/') ? folder.remotePath : `/${folder.remotePath}`
      const localFiles = await walkLocal(folder.localPath)
      const remoteFiles = await listRemote(auth, remoteRoot).catch((err) => {
        if (remoteRoot !== '/' && err instanceof Error && err.message.includes('404')) return []
        throw err
      })
      const remoteByRel = new Map(remoteFiles.map((f) => [f.rel, f]))
      const localByRel = new Map(localFiles.map((f) => [f.rel, f]))

      for (const local of localFiles) {
        const remote = remoteByRel.get(local.rel)
        if (!remote || local.mtimeMs > remote.mtimeMs + 2000) {
          await uploadFile(auth, remoteRoot, local.rel, local.full)
        }
      }

      for (const remote of remoteFiles) {
        const local = localByRel.get(remote.rel)
        if (!local || remote.mtimeMs > local.mtimeMs + 2000) {
          await downloadFile(auth, remoteRoot, remote.rel, folder.localPath)
        }
      }

      patch(id, { status: 'synced', lastSynced: new Date().toISOString(), error: undefined })
    } catch (err) {
      patch(id, { status: 'error', error: err instanceof Error ? err.message : 'Sync failed' })
    } finally {
      syncing.delete(id)
    }
  }

  async function syncAll(): Promise<void> {
    const paused = store.get('syncPaused', false) as boolean
    if (paused) return
    for (const f of list()) {
      if (f.status !== 'paused') await syncFolder(f.id)
    }
  }

  function watchFolder(id: string): void {
    const folder = list().find((f) => f.id === id)
    if (!folder) return
    watchers.get(id)?.close()
    try {
      const w = watch(folder.localPath, { recursive: true }, () => {
        if (debounce.has(id)) clearTimeout(debounce.get(id)!)
        debounce.set(id, setTimeout(() => { syncFolder(id).catch(() => {}) }, 1500))
      })
      watchers.set(id, w)
    } catch {
      // non-recursive fallback
      const w = watch(folder.localPath, () => {
        if (debounce.has(id)) clearTimeout(debounce.get(id)!)
        debounce.set(id, setTimeout(() => { syncFolder(id).catch(() => {}) }, 1500))
      })
      watchers.set(id, w)
    }
  }

  function unwatchFolder(id: string): void {
    watchers.get(id)?.close()
    watchers.delete(id)
    if (debounce.has(id)) clearTimeout(debounce.get(id)!)
    debounce.delete(id)
  }

  function start(): void {
    for (const f of list()) watchFolder(f.id)
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = setInterval(() => { syncAll().catch(() => {}) }, 30000)
    syncAll().catch(() => {})
  }

  function stop(): void {
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = null
    for (const id of watchers.keys()) unwatchFolder(id)
  }

  async function ensureRemoteRoot(auth: DavAuth, remoteRoot: string): Promise<void> {
    if (remoteRoot === '/') return
    const url = buildDavUrl(auth.serverUrl, auth.username, remoteRoot)
    const res = await davRequest('MKCOL', url, auth.authToken)
    if (res.status !== 201 && res.status !== 405 && res.status !== 409 && res.status !== 200) {
      throw new Error(`Could not create cloud folder (HTTP ${res.status})`)
    }
  }

  async function addFolder(localPath: string, remotePath: string): Promise<string> {
    if (!existsSync(localPath)) throw new Error('Local folder does not exist')
    const auth = getAuth()
    if (!auth) throw new Error('Not authenticated — sign in again')
    const remote = remotePath.startsWith('/') ? remotePath : `/${remotePath}`
    await ensureRemoteRoot(auth, remote)
    const id = `sf-${Date.now()}`
    const next = [...list(), { id, localPath, remotePath: remote, status: 'syncing' as const }]
    save(next)
    watchFolder(id)
    await syncFolder(id)
    return id
  }

  function removeFolder(id: string): void {
    unwatchFolder(id)
    save(list().filter((f) => f.id !== id))
  }

  function openLocal(path: string): void {
    shell.openPath(path)
  }

  function setFolderPaused(id: string, paused: boolean): void {
    if (paused) {
      unwatchFolder(id)
      patch(id, { status: 'paused' })
    } else {
      patch(id, { status: 'syncing' })
      watchFolder(id)
      syncFolder(id).catch(() => {})
    }
  }

  return { start, stop, syncFolder, syncAll, addFolder, removeFolder, watchFolder, openLocal, list, setFolderPaused }
}
