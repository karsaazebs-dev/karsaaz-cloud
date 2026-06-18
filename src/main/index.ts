import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification, session, dialog, net, clipboard } from 'electron'
import { join } from 'path'
import { createWriteStream, mkdirSync, existsSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Store from 'electron-store'
import { autoUpdater } from 'electron-updater'
import { type DavAuth } from './dav'
import { createSyncEngine } from './syncEngine'

const store = new Store()
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let syncPaused = (store.get('syncPaused', false) as boolean) ?? false

function readAuth(): DavAuth | null {
  const serverUrl = String(store.get('serverUrl') ?? '').replace(/\/$/, '')
  const authToken = String(store.get('authToken') ?? '')
  const username = String(store.get('username') ?? '')
  if (!serverUrl.startsWith('http') || !authToken || !username) return null
  return { serverUrl, authToken, username }
}

const syncEngine = createSyncEngine(store, () => mainWindow, readAuth)

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#FFFFFF',
      symbolColor: '#09090B',
      height: 32
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('close', (e) => {
    const minimizeToTray = store.get('minimizeToTray', false) as boolean
    if (minimizeToTray && !app.isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  const iconPath = join(__dirname, '../../resources/icon.png')
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon.resize({ width: 16, height: 16 }))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Karsaaz Cloud',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    {
      label: 'Pause Sync',
      type: 'checkbox',
      checked: syncPaused,
      click: (item) => {
        syncPaused = item.checked
        store.set('syncPaused', syncPaused)
        mainWindow?.webContents.send('sync:status', syncPaused ? 'paused' : 'active')
      }
    },
    { type: 'separator' },
    {
      label: 'Check for Updates',
      click: () => mainWindow?.webContents.send('app:check-updates')
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('Karsaaz Cloud')
  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

// Upload a file to Nextcloud WebDAV via main process (bypasses renderer CORS)
function toUploadBuffer(data: ArrayBuffer | Uint8Array): Buffer {
  if (data instanceof ArrayBuffer) return Buffer.from(data)
  if (ArrayBuffer.isView(data)) return Buffer.from(data.buffer, data.byteOffset, data.byteLength)
  throw new Error('Invalid upload payload')
}

function buildDavUploadUrl(serverUrl: string, username: string, userPath: string, fileName: string): string {
  const base = serverUrl.replace(/\/$/, '')
  if (!base.startsWith('http://') && !base.startsWith('https://')) {
    throw new Error('Invalid server URL — sign in again')
  }
  if (!username) throw new Error('Missing username — sign in again')

  const segments = userPath === '/' || userPath === ''
    ? []
    : userPath.split('/').filter(Boolean)
  segments.push(fileName)
  const encodedPath = segments.map((s) => encodeURIComponent(s)).join('/')
  return `${base}/remote.php/dav/files/${encodeURIComponent(username)}/${encodedPath}`
}

ipcMain.handle('nc:upload', async (_event, userPath: string, fileName: string, buffer: ArrayBuffer | Uint8Array) => {
  const serverUrl = String(store.get('serverUrl') ?? '').replace(/\/$/, '')
  const authToken = String(store.get('authToken') ?? '')

  let url: string
  try {
    url = buildDavUploadUrl(serverUrl, String(store.get('username') ?? ''), userPath, fileName)
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : 'Upload error' }
  }

  if (!authToken) {
    return { ok: false, status: 0, error: 'Not authenticated — sign in again' }
  }

  let body: Buffer
  try {
    body = toUploadBuffer(buffer)
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : 'Invalid file data' }
  }

  return new Promise<{ ok: boolean; status: number; error?: string }>((resolve) => {
    try {
      const req = net.request({ url, method: 'PUT' })
      req.setHeader('Authorization', `Basic ${authToken}`)
      req.setHeader('OCS-APIREQUEST', 'true')
      req.setHeader('User-Agent', 'Karsaaz-Sync/1.0.0 (Windows)')
      req.setHeader('Content-Type', 'application/octet-stream')
      req.on('response', (res) => {
        const status = res.statusCode ?? 0
        res.on('data', () => {})
        res.on('end', () => {
          if (status >= 200 && status < 300) {
            resolve({ ok: true, status })
          } else {
            resolve({ ok: false, status, error: `Upload failed (HTTP ${status})` })
          }
        })
        res.on('error', (err) => resolve({ ok: false, status: 0, error: err.message }))
      })
      req.on('error', (err) => resolve({ ok: false, status: 0, error: err.message }))
      req.end(body)
    } catch (err) {
      resolve({ ok: false, status: 0, error: err instanceof Error ? err.message : 'Upload error' })
    }
  })
})

// Fetch binary content (image/video) via main process, returned as base64
ipcMain.handle('nc:fetchBinary', async (_event, url: string) => {
  const authToken = String(store.get('authToken') ?? '')
  return new Promise<{ ok: boolean; base64: string; contentType: string }>((resolve) => {
    try {
      const req = net.request({ url, method: 'GET' })
      req.setHeader('Authorization', `Basic ${authToken}`)
      req.setHeader('OCS-APIREQUEST', 'true')
      req.on('response', (res) => {
        const status = res.statusCode ?? 0
        const ct = String((res.headers['content-type'] as string) ?? 'application/octet-stream').split(';')[0].trim()
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => {
          if (status >= 200 && status < 300) {
            resolve({ ok: true, base64: Buffer.concat(chunks).toString('base64'), contentType: ct })
          } else {
            resolve({ ok: false, base64: '', contentType: '' })
          }
        })
        res.on('error', () => resolve({ ok: false, base64: '', contentType: '' }))
      })
      req.on('error', () => resolve({ ok: false, base64: '', contentType: '' }))
      req.end()
    } catch {
      resolve({ ok: false, base64: '', contentType: '' })
    }
  })
})

// Proxy HTTP requests through main process to avoid CORS in renderer
ipcMain.handle('nc:fetch', async (_event, url: string, method: string, headers: Record<string, string>, body?: string) => {
  return new Promise<{ status: number; text: string; ok: boolean }>((resolve, reject) => {
    try {
      const req = net.request({ url, method })
      Object.entries(headers).forEach(([k, v]) => req.setHeader(k, v))
      req.on('response', (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          const status = res.statusCode ?? 0
          resolve({ status, text, ok: status >= 200 && status < 300 })
        })
        res.on('error', (err) => reject(err))
      })
      req.on('error', (err) => reject(err))
      if (body) req.write(body)
      req.end()
    } catch (err) {
      reject(err)
    }
  })
})

ipcMain.handle('store:get', (_event, key: string) => store.get(key))
ipcMain.handle('store:set', (_event, key: string, value: unknown) => {
  store.set(key, value)
})
ipcMain.handle('store:delete', (_event, key: string) => store.delete(key))
ipcMain.handle('store:clear', () => store.clear())

ipcMain.handle('file:download', async (_event, remotePath: string, filename: string) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: filename,
    title: 'Save File'
  })
  if (canceled || !filePath) return { ok: false, reason: 'cancelled' }

  const serverUrl = String(store.get('serverUrl') ?? '').replace(/\/$/, '')
  const authToken = String(store.get('authToken') ?? '')
  const url = remotePath.startsWith('http') ? remotePath : `${serverUrl}${remotePath}`

  return new Promise<{ ok: boolean; reason?: string }>((resolve) => {
    const req = net.request({ url, method: 'GET' })
    req.setHeader('Authorization', `Basic ${authToken}`)
    req.setHeader('OCS-APIREQUEST', 'true')

    req.on('response', (res) => {
      if (res.statusCode !== 200) {
        resolve({ ok: false, reason: `HTTP ${res.statusCode}` })
        return
      }
      const dir = filePath.substring(0, filePath.lastIndexOf('\\') || filePath.lastIndexOf('/'))
      if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true })
      const ws = createWriteStream(filePath)
      res.on('data', (chunk) => ws.write(chunk))
      res.on('end', () => { ws.end(); resolve({ ok: true }) })
      res.on('error', (err) => { ws.destroy(); resolve({ ok: false, reason: err.message }) })
    })
    req.on('error', (err) => resolve({ ok: false, reason: err.message }))
    req.end()
  })
})

// Sync folder management
ipcMain.handle('sync:list-folders', () => syncEngine.list())
ipcMain.handle('sync:add-folder', (_event, localPath: string, remotePath: string) =>
  syncEngine.addFolder(localPath, remotePath))
ipcMain.handle('sync:remove-folder', (_event, id: string) => syncEngine.removeFolder(id))
ipcMain.handle('sync:run-now', async (_event, id?: string) => {
  if (id) await syncEngine.syncFolder(id)
  else await syncEngine.syncAll()
})
ipcMain.handle('sync:open-local', (_event, localPath: string) => syncEngine.openLocal(localPath))
ipcMain.handle('sync:update-folder-status', (_event, id: string, status: string) => {
  if (status === 'paused') syncEngine.setFolderPaused(id, true)
  else if (status === 'synced') syncEngine.setFolderPaused(id, false)
})

ipcMain.handle('app:open-external', async (_event, url: string) => {
  if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
    await shell.openExternal(url)
  }
})

ipcMain.handle('dialog:select-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow ?? undefined, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select local folder'
  })
  if (canceled || !filePaths[0]) return null
  return filePaths[0]
})

ipcMain.handle('clipboard:write', (_event, text: string) => {
  clipboard.writeText(String(text ?? ''))
})

ipcMain.handle('notification:show', (_event, { title, body }: { title: string; body: string }) => {
  if (Notification.isSupported()) {
    const n = new Notification({ title, body, icon: join(__dirname, '../../resources/icon.png') })
    n.on('click', () => {
      mainWindow?.show()
      mainWindow?.focus()
    })
    n.show()
  }
})

ipcMain.handle('sync:get-status', () => (syncPaused ? 'paused' : 'active'))
ipcMain.handle('sync:set-paused', (_event, paused: boolean) => {
  syncPaused = paused
  store.set('syncPaused', paused)
})

// Auto-updater IPC
ipcMain.handle('updater:check', () => {
  if (!is.dev) autoUpdater.checkForUpdates()
})
ipcMain.handle('updater:download', () => {
  if (!is.dev) autoUpdater.downloadUpdate()
})
ipcMain.handle('updater:install', () => {
  autoUpdater.quitAndInstall()
})

function setupAutoUpdater(): void {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('updater:available', { version: info.version })
  })
  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('updater:not-available')
  })
  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('updater:progress', Math.round(progress.percent))
  })
  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('updater:downloaded')
  })
  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('updater:error', err.message)
  })

  if (!is.dev) {
    app.whenReady().then(() => {
      setTimeout(() => autoUpdater.checkForUpdates(), 5000)
    })
  }
}

declare module 'electron' {
  interface App {
    isQuitting?: boolean
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.karsaaz.cloud')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Add CORS headers to all responses (belt-and-suspenders for webSecurity:false)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'access-control-allow-origin': ['*'],
        'access-control-allow-headers': ['*'],
        'access-control-allow-methods': ['GET, POST, PUT, DELETE, OPTIONS, PROPFIND, MKCOL, MOVE, COPY, REPORT, PROPPATCH']
      }
    })
  })

  // Inject Basic auth into requests to the Nextcloud server (for <img> thumbnail previews etc.)
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const serverUrl = store.get('serverUrl') as string | undefined
    const authToken = store.get('authToken') as string | undefined
    if (serverUrl && authToken && details.url.startsWith(serverUrl)) {
      callback({
        requestHeaders: {
          ...details.requestHeaders,
          Authorization: `Basic ${authToken}`,
          'OCS-APIREQUEST': 'true',
          'User-Agent': 'Karsaaz-Sync/1.0.0 (Windows)'
        }
      })
    } else {
      callback({ requestHeaders: details.requestHeaders })
    }
  })

  createWindow()
  createTray()
  setupAutoUpdater()
  syncEngine.start()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else mainWindow?.show()
  })
})

app.on('window-all-closed', () => {
  const minimizeToTray = store.get('minimizeToTray', false) as boolean
  if (!minimizeToTray && process.platform !== 'darwin') {
    app.quit()
  }
})
