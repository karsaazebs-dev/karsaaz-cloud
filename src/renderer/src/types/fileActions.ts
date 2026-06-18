export type FileAction =
  | 'edit'
  | 'favourite'
  | 'details'
  | 'rename'
  | 'tag'
  | 'export'
  | 'share'
  | 'sync'
  | 'move'
  | 'pin'
  | 'delete'

export interface FileActionMenuItem {
  action: FileAction
  label: string
  destructive?: boolean
  folderHidden?: boolean
}

export const FILE_ACTION_MENU_ITEMS: FileActionMenuItem[] = [
  { action: 'edit', label: 'Edit', folderHidden: true },
  { action: 'favourite', label: 'Add to favourite' },
  { action: 'details', label: 'Details' },
  { action: 'rename', label: 'Rename' },
  { action: 'tag', label: 'Tag', folderHidden: true },
  { action: 'export', label: 'Export', folderHidden: true },
  { action: 'share', label: 'Share' },
  { action: 'sync', label: 'Sync' },
  { action: 'move', label: 'Move to folder' },
  { action: 'pin', label: 'Pin' },
  { action: 'delete', label: 'Delete', destructive: true }
]
