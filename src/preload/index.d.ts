import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      nc: {
        fetch: (url: string, method: string, headers: Record<string, string>, body?: string) => Promise<{ status: number; text: string; ok: boolean }>
        upload: (uploadPath: string, buffer: ArrayBuffer) => Promise<{ ok: boolean; status: number; error?: string }>
        fetchBinary: (url: string) => Promise<{ ok: boolean; base64: string; contentType: string }>
      }
      store: {
        get: (key: string) => Promise<unknown>
        set: (key: string, value: unknown) => Promise<void>
        delete: (key: string) => Promise<void>
        clear: () => Promise<void>
      }
      app: {
        openExternal: (url: string) => Promise<void>
      }
      dialog: {
        selectFolder: () => Promise<string | null>
      }
      clipboard: {
        write: (text: string) => Promise<void>
      }
      notification: {
        show: (title: string, body: string) => Promise<void>
      }
      sync: {
        getStatus: () => Promise<string>
        setPaused: (paused: boolean) => Promise<void>
        onStatus: (cb: (status: string) => void) => () => void
      }
      file: {
        download: (remotePath: string, filename: string) => Promise<{ ok: boolean; reason?: string }>
      }
      syncFolders: {
        list: () => Promise<Array<{ id: string; localPath: string; remotePath: string; status: string; lastSynced?: string }>>
        add: (localPath: string, remotePath: string) => Promise<string>
        remove: (id: string) => Promise<void>
        updateStatus: (id: string, status: string) => Promise<void>
      }
      onCheckUpdates: (callback: () => void) => () => void
      updater: {
        check: () => Promise<void>
        download: () => Promise<void>
        install: () => Promise<void>
        onAvailable: (cb: (info: { version: string }) => void) => () => void
        onNotAvailable: (cb: () => void) => () => void
        onProgress: (cb: (pct: number) => void) => () => void
        onDownloaded: (cb: () => void) => () => void
        onError: (cb: (msg: string) => void) => () => void
      }
    }
  }
}
