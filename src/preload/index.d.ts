import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      store: {
        get: (key: string) => Promise<unknown>
        set: (key: string, value: unknown) => Promise<void>
        delete: (key: string) => Promise<void>
        clear: () => Promise<void>
      }
      notification: {
        show: (title: string, body: string) => Promise<void>
      }
      sync: {
        getStatus: () => Promise<string>
        setPaused: (paused: boolean) => Promise<void>
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
