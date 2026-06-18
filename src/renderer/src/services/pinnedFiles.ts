import type { FileItem } from '../types/files'

const STORE_KEY = 'pinnedFileIds'

export async function getPinnedIds(): Promise<Set<string>> {
  const raw = await window.api.store.get(STORE_KEY)
  if (!Array.isArray(raw)) return new Set()
  return new Set(raw.map(String))
}

export async function isPinned(fileId: string): Promise<boolean> {
  const ids = await getPinnedIds()
  return ids.has(fileId)
}

export async function togglePin(fileId: string): Promise<boolean> {
  const ids = await getPinnedIds()
  const next = !ids.has(fileId)
  if (next) ids.add(fileId)
  else ids.delete(fileId)
  await window.api.store.set(STORE_KEY, [...ids])
  return next
}

export async function applyPinnedState(files: FileItem[]): Promise<FileItem[]> {
  const ids = await getPinnedIds()
  return files.map((f) => ({ ...f, pinned: ids.has(f.id) }))
}
