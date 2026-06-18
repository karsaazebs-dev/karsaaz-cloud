import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  nc: {
    fetch: (url: string, method: string, headers: Record<string, string>, body?: string) =>
      ipcRenderer.invoke('nc:fetch', url, method, headers, body) as Promise<{ status: number; text: string; ok: boolean }>,
    upload: (uploadPath: string, buffer: ArrayBuffer) =>
      ipcRenderer.invoke('nc:upload', uploadPath, buffer) as Promise<{ ok: boolean; status: number; error?: string }>,
    fetchBinary: (url: string) =>
      ipcRenderer.invoke('nc:fetchBinary', url) as Promise<{ ok: boolean; base64: string; contentType: string }>
  },
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
    setPaused: (paused: boolean) => ipcRenderer.invoke('sync:set-paused', paused),
    onStatus: (cb: (status: string) => void) => {
      ipcRenderer.on('sync:status', (_e, status) => cb(status))
      return () => ipcRenderer.removeAllListeners('sync:status')
    }
  },
  file: {
    download: (remotePath: string, filename: string) => ipcRenderer.invoke('file:download', remotePath, filename)
  },
  syncFolders: {
    list: () => ipcRenderer.invoke('sync:list-folders'),
    add: (localPath: string, remotePath: string) => ipcRenderer.invoke('sync:add-folder', localPath, remotePath),
    remove: (id: string) => ipcRenderer.invoke('sync:remove-folder', id),
    updateStatus: (id: string, status: string) => ipcRenderer.invoke('sync:update-folder-status', id, status)
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
