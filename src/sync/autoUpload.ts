/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as SecureStore from "expo-secure-store";
import * as MediaLibrary from "expo-media-library/legacy";
import { queueFileUpload } from "./syncEngine";

const AUTO_UPLOAD_KEY = "karsaaz_auto_upload_enabled";
const AUTO_UPLOAD_PATH = "/Photos";

export async function isAutoUploadEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(AUTO_UPLOAD_KEY)) === "true";
}

export async function setAutoUploadEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(AUTO_UPLOAD_KEY, enabled ? "true" : "false");
}

export async function scanAndQueueNewPhotos(): Promise<number> {
  const enabled = await isAutoUploadEnabled();
  if (!enabled) return 0;

  const permission = await MediaLibrary.requestPermissionsAsync();
  if (!permission.granted) return 0;

  const assets = await MediaLibrary.getAssetsAsync({
    mediaType: MediaLibrary.MediaType.photo,
    sortBy: MediaLibrary.SortBy.creationTime,
    first: 20,
  });

  let queued = 0;
  for (const asset of assets.assets) {
    await queueFileUpload({
      id: `auto-${asset.id}`,
      remotePath: `${AUTO_UPLOAD_PATH}/${asset.filename}`,
      localUri: asset.uri,
      name: asset.filename,
      size: 0,
    });
    queued += 1;
  }
  return queued;
}
