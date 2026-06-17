import { ipcMain } from 'electron'

let syncInterval: ReturnType<typeof setInterval> | null = null
let paused = false

export function initSyncHandlers(): void {
  ipcMain.handle('sync:start', (_event, folders: { localPath: string; remotePath: string }[]) => {
    if (syncInterval) clearInterval(syncInterval)
    syncInterval = setInterval(() => {
      if (!paused) {
        // Poll remote changes every 30s; full chokidar integration deferred
        console.log('[sync] polling', folders.length, 'folders')
      }
    }, 30000)
  })

  ipcMain.handle('sync:stop', () => {
    if (syncInterval) {
      clearInterval(syncInterval)
      syncInterval = null
    }
  })
}

export function setSyncPaused(value: boolean): void {
  paused = value
}
