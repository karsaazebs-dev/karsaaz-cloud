/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("karsaaz_sync.db");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS file_cache (
      path TEXT PRIMARY KEY,
      etag TEXT NOT NULL,
      name TEXT NOT NULL,
      mime_type TEXT,
      size INTEGER DEFAULT 0,
      is_directory INTEGER DEFAULT 0,
      last_modified TEXT,
      cached_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS upload_queue (
      id TEXT PRIMARY KEY,
      remote_path TEXT NOT NULL,
      local_uri TEXT NOT NULL,
      name TEXT NOT NULL,
      size INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      retries INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pinned_files (
      path TEXT PRIMARY KEY,
      local_path TEXT NOT NULL,
      etag TEXT NOT NULL,
      pinned_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  return db;
}

export async function cacheFileMetadata(entry: {
  path: string;
  etag: string;
  name: string;
  mimeType: string;
  size: number;
  isDirectory: boolean;
  lastModified: string;
}): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO file_cache
     (path, etag, name, mime_type, size, is_directory, last_modified, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.path,
      entry.etag,
      entry.name,
      entry.mimeType,
      entry.size,
      entry.isDirectory ? 1 : 0,
      entry.lastModified,
      new Date().toISOString(),
    ]
  );
}

export async function getCachedFiles(folderPath: string): Promise<
  Array<{
    path: string;
    etag: string;
    name: string;
    mimeType: string;
    size: number;
    isDirectory: boolean;
    lastModified: string;
  }>
> {
  const database = await getDatabase();
  const prefix = folderPath === "/" ? "/" : folderPath;
  const rows = await database.getAllAsync<{
    path: string;
    etag: string;
    name: string;
    mime_type: string;
    size: number;
    is_directory: number;
    last_modified: string;
  }>(
    `SELECT * FROM file_cache WHERE path LIKE ? AND path != ?`,
    [`${prefix}%`, prefix]
  );
  return rows.map((r) => ({
    path: r.path,
    etag: r.etag,
    name: r.name,
    mimeType: r.mime_type,
    size: r.size,
    isDirectory: r.is_directory === 1,
    lastModified: r.last_modified,
  }));
}

export async function enqueueUpload(job: {
  id: string;
  remotePath: string;
  localUri: string;
  name: string;
  size: number;
}): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO upload_queue
     (id, remote_path, local_uri, name, size, status, retries, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', 0, ?)`,
    [job.id, job.remotePath, job.localUri, job.name, job.size, new Date().toISOString()]
  );
}

export async function getPendingUploads(): Promise<
  Array<{
    id: string;
    remotePath: string;
    localUri: string;
    name: string;
    size: number;
    retries: number;
  }>
> {
  const database = await getDatabase();
  return database.getAllAsync(
    `SELECT id, remote_path as remotePath, local_uri as localUri, name, size, retries
     FROM upload_queue WHERE status = 'pending' ORDER BY created_at ASC`
  );
}

export async function markUploadDone(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`DELETE FROM upload_queue WHERE id = ?`, [id]);
}

export async function incrementUploadRetry(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE upload_queue SET retries = retries + 1 WHERE id = ?`,
    [id]
  );
}

export async function setSyncState(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO sync_state (key, value) VALUES (?, ?)`,
    [key, value]
  );
}

export async function getRecentCachedFiles(limit = 50): Promise<
  Array<{
    path: string;
    etag: string;
    name: string;
    mimeType: string;
    size: number;
    isDirectory: boolean;
    lastModified: string;
  }>
> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    path: string;
    etag: string;
    name: string;
    mime_type: string;
    size: number;
    is_directory: number;
    last_modified: string;
  }>(
    `SELECT * FROM file_cache WHERE is_directory = 0 ORDER BY last_modified DESC LIMIT ?`,
    [limit]
  );
  return rows.map((r) => ({
    path: r.path,
    etag: r.etag,
    name: r.name,
    mimeType: r.mime_type,
    size: r.size,
    isDirectory: false,
    lastModified: r.last_modified,
  }));
}

export async function getCachedFilesByPaths(paths: string[]): Promise<
  Array<{
    path: string;
    etag: string;
    name: string;
    mimeType: string;
    size: number;
    isDirectory: boolean;
    lastModified: string;
  }>
> {
  if (paths.length === 0) return [];
  const database = await getDatabase();
  const placeholders = paths.map(() => "?").join(",");
  const rows = await database.getAllAsync<{
    path: string;
    etag: string;
    name: string;
    mime_type: string;
    size: number;
    is_directory: number;
    last_modified: string;
  }>(`SELECT * FROM file_cache WHERE path IN (${placeholders})`, paths);
  return rows.map((r) => ({
    path: r.path,
    etag: r.etag,
    name: r.name,
    mimeType: r.mime_type,
    size: r.size,
    isDirectory: r.is_directory === 1,
    lastModified: r.last_modified,
  }));
}

export async function getCachedImages(limit = 300): Promise<
  Array<{
    path: string;
    etag: string;
    name: string;
    mimeType: string;
    size: number;
    isDirectory: boolean;
    lastModified: string;
  }>
> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    path: string;
    etag: string;
    name: string;
    mime_type: string;
    size: number;
    is_directory: number;
    last_modified: string;
  }>(
    `SELECT * FROM file_cache
     WHERE is_directory = 0 AND mime_type LIKE 'image/%'
     ORDER BY last_modified DESC LIMIT ?`,
    [limit]
  );
  return rows.map((r) => ({
    path: r.path,
    etag: r.etag,
    name: r.name,
    mimeType: r.mime_type,
    size: r.size,
    isDirectory: false,
    lastModified: r.last_modified,
  }));
}

export async function getSyncState(key: string): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    `SELECT value FROM sync_state WHERE key = ?`,
    [key]
  );
  return row?.value ?? null;
}
