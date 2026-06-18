export type FileType = 'folder' | 'image' | 'document' | 'video' | 'other'

export type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'size'

export interface FileItem {
  id: string
  name: string
  size: number
  sizeLabel: string
  modifiedAt: Date
  modifiedLabel: string
  type: FileType
  thumbnail?: string
  pinned?: boolean
  favourite?: boolean
  shared?: boolean
  sharedBy?: string
  owner?: string
  isFolder?: boolean
  path: string
  parentPath?: string
}

export interface UploadItem {
  id: string
  name: string
  size: number
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled'
  error?: string
}

export interface SyncFolder {
  id: string
  localPath: string
  remotePath: string
  status: 'synced' | 'syncing' | 'error' | 'paused'
  lastSynced?: string
  error?: string
}

export interface ActivityEntry {
  id: string
  user: string
  avatar?: string
  action: string
  target: string
  timestamp: Date
  type: 'upload' | 'share' | 'delete' | 'edit' | 'other'
}

export interface StorageRequest {
  id: string
  user: string
  email: string
  requestedGb: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface CloudUser {
  id: string
  name: string
  email: string
  quota: string
  used: string
  role: 'admin' | 'user'
  status: 'active' | 'disabled'
  avatar?: string
}
