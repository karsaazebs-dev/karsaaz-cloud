/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import * as SecureStore from "expo-secure-store";
import { runBackgroundSync } from "./syncEngine";

export const BACKGROUND_SYNC_TASK = "KARSAAZ_BACKGROUND_SYNC";

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    const serverUrl = await SecureStore.getItemAsync("karsaaz_server_url");
    const username = await SecureStore.getItemAsync("karsaaz_username");
    const password = await SecureStore.getItemAsync("karsaaz_app_password");
    if (!serverUrl || !username || !password) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    await runBackgroundSync(serverUrl, username, password);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync(): Promise<void> {
  const status = await BackgroundFetch.getStatusAsync();
  if (status === BackgroundFetch.BackgroundFetchStatus.Restricted) return;

  const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  if (!registered) {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}
