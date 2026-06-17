import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store:delete', key),
    clear: () => ipcRenderer.invoke('store:clear')
  },
  notification: {
    show: (title: string, body: string) => ipcRenderer.invoke('notification:show', { title, body })
  },
  sync: {
    getStatus: () => ipcRenderer.invoke('sync:get-status'),
    setPaused: (paused: boolean) => ipcRenderer.invoke('sync:set-paused', paused)
  },
  onCheckUpdates: (callback: () => void) => {
    ipcRenderer.on('app:check-updates', callback)
    return () => ipcRenderer.removeListener('app:check-updates', callback)
  },
  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    onAvailable: (cb: (info: { version: string }) => void) => {
      ipcRenderer.on('updater:available', (_e, info) => cb(info))
      return () => ipcRenderer.removeAllListeners('updater:available')
    },
    onNotAvailable: (cb: () => void) => {
      ipcRenderer.on('updater:not-available', cb)
      return () => ipcRenderer.removeAllListeners('updater:not-available')
    },
    onProgress: (cb: (pct: number) => void) => {
      ipcRenderer.on('updater:progress', (_e, pct) => cb(pct))
      return () => ipcRenderer.removeAllListeners('updater:progress')
    },
    onDownloaded: (cb: () => void) => {
      ipcRenderer.on('updater:downloaded', cb)
      return () => ipcRenderer.removeAllListeners('updater:downloaded')
    },
    onError: (cb: (msg: string) => void) => {
      ipcRenderer.on('updater:error', (_e, msg) => cb(msg))
      return () => ipcRenderer.removeAllListeners('updater:error')
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
