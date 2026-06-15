/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { FileType, KarsaazFile } from "@karsaaz/cloud-api";

function mimeToFileType(mime: string, isDirectory: boolean): FileType {
  if (isDirectory) return "directory";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  if (mime.includes("spreadsheet")) return "spreadsheet";
  if (mime.includes("presentation")) return "presentation";
  if (mime.includes("word") || mime.includes("document")) return "document";
  if (mime.includes("zip") || mime.includes("tar") || mime.includes("rar")) return "archive";
  if (mime.startsWith("text/")) return "text";
  return "other";
}

export function cacheEntryToKarsaazFile(entry: {
  path: string;
  etag: string;
  name: string;
  mimeType: string;
  size: number;
  isDirectory: boolean;
  lastModified: string;
}): KarsaazFile {
  const mime = entry.mimeType || (entry.isDirectory ? "httpd/unix-directory" : "application/octet-stream");
  return {
    id: entry.path,
    fileId: 0,
    name: entry.name,
    path: entry.path,
    type: entry.isDirectory ? "directory" : "file",
    mimeType: mime,
    fileType: mimeToFileType(mime, entry.isDirectory),
    size: entry.size,
    lastModified: new Date(entry.lastModified),
    etag: entry.etag,
    permissions: 0,
    isFavorite: false,
    isShared: false,
    shareTypes: [],
    tags: [],
    hasPreview: false,
  };
}

export function sharePathToDavPath(sharePath: string, username: string): string {
  if (sharePath.startsWith("/files/")) return sharePath;
  const normalized = sharePath.startsWith("/") ? sharePath : `/${sharePath}`;
  return `/files/${username}${normalized}`;
}
