import { useCallback } from 'react'
import { deleteFile, moveFile, toggleFavourite } from '../services/filesApi'
import { createShare } from '../services/sharingApi'
import { assignTagToFile, getOrCreateTag } from '../services/tagsApi'
import { davHrefToUserPath, resolveDavHref } from '../utils/davPaths'
import { getUsername } from '../services/nextcloud'
import { useToast } from './useToast'
import { useActionDialog } from './useActionDialog'
import type { FileItem } from '../types/files'
import type { FileAction } from '../types/fileActions'

function isNumericFileId(id: string): boolean {
  return /^\d+$/.test(id)
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    await window.api.clipboard.write(text)
  }
}

export function useFileActions(
  onChanged?: () => void,
  onShowDetails?: (file: FileItem) => void
) {
  const { toast } = useToast()
  const { prompt, confirm, selectFolder } = useActionDialog()

  const handleFileAction = useCallback(async (action: FileAction, file: FileItem) => {
    const username = await getUsername()
    const davPath = await resolveDavHref(file.path)
    const userPath = davHrefToUserPath(davPath, username)

    if (action === 'details') {
      onShowDetails?.(file)
      return
    }

    if (action === 'delete') {
      const ok = await confirm({
        title: 'Delete file',
        message: `Delete "${file.name}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        destructive: true
      })
      if (!ok) return
      try {
        await deleteFile(davPath)
        toast('success', 'Deleted', file.name)
        onChanged?.()
      } catch (e) {
        toast('error', 'Delete failed', e instanceof Error ? e.message : file.name)
      }
      return
    }

    if (action === 'share') {
      try {
        const share = await createShare(userPath)
        const serverUrl = ((await window.api.store.get('serverUrl')) as string ?? '').replace(/\/$/, '')
        const link = `${serverUrl}/s/${share.token}`
        await copyToClipboard(link)
        toast('success', 'Share link copied', link)
      } catch (e) {
        toast('error', 'Share failed', e instanceof Error ? e.message : 'Could not create link')
      }
      return
    }

    if (action === 'export' || action === 'download') {
      try {
        const result = await window.api.file.download(davPath, file.name)
        if (result.ok) toast('success', 'Downloaded', file.name)
        else if (result.reason !== 'cancelled') toast('error', 'Download failed', result.reason ?? '')
      } catch {
        toast('error', 'Download failed', file.name)
      }
      return
    }

    if (action === 'favourite' || action === 'pin') {
      try {
        const newVal = action === 'pin' ? true : !file.favourite
        await toggleFavourite(davPath, newVal)
        toast('success', newVal ? 'Added to favourites' : 'Removed from favourites', file.name)
        onChanged?.()
      } catch (e) {
        toast('error', 'Favourite update failed', e instanceof Error ? e.message : file.name)
      }
      return
    }

    if (action === 'rename') {
      const newName = await prompt({
        title: 'Rename',
        label: 'New name',
        defaultValue: file.name,
        confirmLabel: 'Rename'
      })
      if (!newName || newName === file.name) return
      const dir = userPath.substring(0, userPath.lastIndexOf('/') + 1)
      try {
        await moveFile(davPath, dir + newName)
        toast('success', 'Renamed', newName)
        onChanged?.()
      } catch (e) {
        toast('error', 'Rename failed', e instanceof Error ? e.message : file.name)
      }
      return
    }

    if (action === 'move') {
      const dest = await prompt({
        title: 'Move to folder',
        label: 'Destination folder path',
        defaultValue: '/',
        placeholder: '/Documents',
        confirmLabel: 'Move'
      })
      if (!dest) return
      const destPath = dest.endsWith('/') ? dest + file.name : `${dest}/${file.name}`
      try {
        await moveFile(davPath, destPath)
        toast('success', 'Moved', file.name)
        onChanged?.()
      } catch (e) {
        toast('error', 'Move failed', e instanceof Error ? e.message : file.name)
      }
      return
    }

    if (action === 'edit') {
      try {
        const serverUrl = ((await window.api.store.get('serverUrl')) as string ?? '').replace(/\/$/, '')
        const parentDir = userPath.substring(0, userPath.lastIndexOf('/')) || '/'
        const url = isNumericFileId(file.id)
          ? `${serverUrl}/apps/files/files/${file.id}?dir=${encodeURIComponent(parentDir)}&openfile=true`
          : `${serverUrl}/apps/files/?dir=${encodeURIComponent(parentDir)}&openfile=${encodeURIComponent(file.name)}`
        await window.api.app.openExternal(url)
        toast('info', 'Opening in browser', file.name)
      } catch {
        toast('error', 'Could not open editor', 'Try opening the file in the web app')
      }
      return
    }

    if (action === 'sync') {
      const localPath = await selectFolder()
      if (!localPath) return
      const remoteDir = userPath.substring(0, userPath.lastIndexOf('/')) || '/'
      try {
        await window.api.syncFolders.add(localPath, remoteDir)
        toast('success', 'Sync folder added', `${localPath} ↔ ${remoteDir}`)
      } catch {
        toast('error', 'Sync setup failed', 'Could not add sync folder')
      }
      return
    }

    if (action === 'tag') {
      if (!isNumericFileId(file.id)) {
        toast('error', 'Cannot tag file', 'File ID not available')
        return
      }
      const tagName = await prompt({
        title: 'Add tag',
        label: 'Tag name',
        placeholder: 'e.g. Important',
        confirmLabel: 'Add tag'
      })
      if (!tagName) return
      try {
        const tag = await getOrCreateTag(tagName)
        await assignTagToFile(file.id, tag.id)
        toast('success', 'Tag added', tag.name)
        onChanged?.()
      } catch (e) {
        toast('error', 'Tag failed', e instanceof Error ? e.message : tagName)
      }
    }
  }, [onChanged, onShowDetails, toast, prompt, confirm, selectFolder])

  return handleFileAction
}
