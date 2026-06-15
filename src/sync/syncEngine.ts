/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as FileSystem from "expo-file-system/legacy";
import * as Notifications from "expo-notifications";
import { Buffer } from "buffer";
import {
  createWebDAVClient,
  listDirectory,
  uploadFile,
} from "@karsaaz/cloud-api";
import {
  cacheFileMetadata,
  enqueueUpload,
  getPendingUploads,
  incrementUploadRetry,
  markUploadDone,
  setSyncState,
} from "./database";

const CACHE_DIR = `${FileSystem.documentDirectory}karsaaz-cache/`;
const POLL_INTERVAL_KEY = "last_poll_at";

export async function ensureCacheDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

export async function pollRemoteChanges(
  serverUrl: string,
  username: string,
  appPassword: string,
  folderPath = "/"
): Promise<number> {
  const client = createWebDAVClient(username, appPassword);
  const files = await listDirectory(client, username, folderPath);

  for (const file of files) {
    await cacheFileMetadata({
      path: file.path,
      etag: file.etag,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      isDirectory: file.type === "directory",
      lastModified: file.lastModified.toISOString(),
    });
  }

  await setSyncState(POLL_INTERVAL_KEY, new Date().toISOString());
  return files.length;
}

export async function processUploadQueue(
  username: string,
  appPassword: string
): Promise<void> {
  const pending = await getPendingUploads();
  if (pending.length === 0) return;

  const client = createWebDAVClient(username, appPassword);

  for (const job of pending) {
    try {
      const base64 = await FileSystem.readAsStringAsync(job.localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const buffer = Buffer.from(base64, "base64");
      await uploadFile(client, username, job.remotePath, buffer);
      await markUploadDone(job.id);
    } catch (error) {
      await incrementUploadRetry(job.id);
      if (job.retries >= 3) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Upload failed",
            body: `Could not upload ${job.name}`,
          },
          trigger: null,
        });
      }
    }
  }
}

export async function runBackgroundSync(
  serverUrl: string,
  username: string,
  appPassword: string
): Promise<void> {
  await ensureCacheDir();
  await pollRemoteChanges(serverUrl, username, appPassword);
  await processUploadQueue(username, appPassword);
}

export async function queueFileUpload(params: {
  id: string;
  remotePath: string;
  localUri: string;
  name: string;
  size: number;
}): Promise<void> {
  await enqueueUpload(params);
}
