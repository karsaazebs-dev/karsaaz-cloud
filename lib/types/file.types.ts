// File and directory types

export type FileType =
  | "directory"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "pdf"
  | "archive"
  | "code"
  | "text"
  | "other";

export interface KarsaazFile {
  id: string;
  fileId: number;
  name: string;
  path: string;
  type: "file" | "directory";
  mimeType: string;
  fileType: FileType;
  size: number;
  lastModified: Date;
  etag: string;
  permissions: number;
  isFavorite: boolean;
  isShared: boolean;
  shareTypes: number[];
  tags: string[];
  hasPreview: boolean;
  thumbnailUrl?: string;
  ownerId?: string;
  ownerDisplayName?: string;
  comment?: string;
}

export interface FilePermissions {
  canRead: boolean;
  canUpdate: boolean;
  canCreate: boolean;
  canDelete: boolean;
  canShare: boolean;
  canReshare: boolean;
}

export type FileViewMode = "list" | "grid";

export type FileSortField = "name" | "size" | "lastModified" | "mimeType";
export type FileSortDirection = "asc" | "desc";

export interface FileSort {
  field: FileSortField;
  direction: FileSortDirection;
}

export interface FileUpload {
  id: string;
  name: string;
  path: string;
  size: number;
  status: "pending" | "uploading" | "paused" | "done" | "error" | "conflict";
  progress: number;
  error?: string;
}

export interface FileVersion {
  id: string;
  fileId: number;
  label: string;
  timestamp: Date;
  size: number;
  mimeType: string;
  href: string;
}

export interface TrashItem {
  id: string;
  originalLocation: string;
  name: string;
  deletedAt: Date;
  size: number;
  mimeType: string;
  type: "file" | "directory";
  href: string;
}

export interface FileReminder {
  fileId: number;
  dueDate: Date | null;
}

export interface FileComment {
  id: string;
  message: string;
  actorId: string;
  actorType: string;
  actorDisplayName: string;
  creationDateTime: Date;
  verb: string;
  isUnread: boolean;
}
