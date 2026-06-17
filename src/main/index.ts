import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Store from 'electron-store'
import { autoUpdater } from 'electron-updater'

const store = new Store()
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let syncPaused = false

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

ipcMain.handle('store:get', (_event, key: string) => store.get(key))
ipcMain.handle('store:set', (_event, key: string, value: unknown) => {
  store.set(key, value)
})
ipcMain.handle('store:delete', (_event, key: string) => store.delete(key))
ipcMain.handle('store:clear', () => store.clear())

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
  createWindow()
  createTray()
  setupAutoUpdater()
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
