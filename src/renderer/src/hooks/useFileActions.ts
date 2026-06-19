import { useCallback } from 'react'
import { deleteFile, moveFile, toggleFavourite } from '../services/filesApi'
import { createShare } from '../services/sharingApi'
import { addTagToFile } from '../services/tagsApi'
import { togglePin } from '../services/pinnedFiles'
import { davHrefToUserPath, resolveDavHref } from '../utils/davPaths'
import { isOfficeEditableName, isOfficeFileId } from '../services/officeApi'
import { useOfficeEditor } from './useOfficeEditor'
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

function buildEditUrl(serverUrl: string, file: FileItem, userPath: string): string {
  const parentDir = userPath.substring(0, userPath.lastIndexOf('/')) || '/'
  if (isNumericFileId(file.id)) {
    return `${serverUrl}/index.php/apps/files/f/${file.id}?openfile=true`
  }
  return `${serverUrl}/index.php/apps/files/?dir=${encodeURIComponent(parentDir)}&openfile=${encodeURIComponent(file.name)}`
}

export function useFileActions(
  onChanged?: () => void,
  onShowDetails?: (file: FileItem) => void
) {
  const { toast } = useToast()
  const { prompt, confirm, selectFolder, pickMoveFolder, pickTag } = useActionDialog()
  const office = useOfficeEditor()

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

    if (action === 'favourite') {
      try {
        const newVal = !file.favourite
        await toggleFavourite(davPath, newVal)
        toast('success', newVal ? 'Added to favourites' : 'Removed from favourites', file.name)
        onChanged?.()
      } catch (e) {
        toast('error', 'Favourite update failed', e instanceof Error ? e.message : file.name)
      }
      return
    }

    if (action === 'pin') {
      try {
        const pinned = await togglePin(file.id)
        toast('success', pinned ? 'Pinned' : 'Unpinned', file.name)
        onChanged?.()
      } catch (e) {
        toast('error', 'Pin update failed', e instanceof Error ? e.message : file.name)
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
      const parentDir = userPath.substring(0, userPath.lastIndexOf('/')) || '/'
      const destDir = await pickMoveFolder(file.isFolder ? userPath : parentDir)
      if (!destDir) return
      const destPath = destDir.endsWith('/') ? destDir + file.name : `${destDir}/${file.name}`
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
      if (file.isFolder) return
      try {
        if (isOfficeFileId(file.id) || isOfficeEditableName(file.name)) {
          await office.openFile(file)
        } else {
          const serverUrl = ((await window.api.store.get('serverUrl')) as string ?? '').replace(/\/$/, '')
          const url = buildEditUrl(serverUrl, file, userPath)
          await window.api.app.openExternal(url)
          toast('info', 'Opening in browser', file.name)
        }
      } catch (e) {
        toast('error', 'Could not open editor', e instanceof Error ? e.message : file.name)
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
      const tagName = await pickTag()
      if (!tagName) return
      try {
        await addTagToFile(userPath, tagName)
        toast('success', 'Tag added', tagName)
        onChanged?.()
      } catch (e) {
        toast('error', 'Tag failed', e instanceof Error ? e.message : tagName)
      }
    }
  }, [onChanged, onShowDetails, toast, prompt, confirm, selectFolder, pickMoveFolder, pickTag, office])

  return handleFileAction
}
