/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Platform } from "react-native";
import Constants from "expo-constants";

const SESSION_ID = "8681e3";
const INGEST_PATH = "/ingest/d1711421-16cf-4f95-8d29-080d0a99529f";

function getIngestHosts(): string[] {
  if (Platform.OS === "web") return ["127.0.0.1"];
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | null)?.debuggerHost;
  const lanHost = hostUri?.split(":")[0];
  return lanHost ? [lanHost, "127.0.0.1"] : ["127.0.0.1"];
}

export function debugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
  runId = "pre-fix"
) {
  const payload = {
    sessionId: SESSION_ID,
    runId,
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  // #region agent log
  if (__DEV__) {
    console.warn(`[DBG:${hypothesisId}] ${location} — ${message}`, JSON.stringify(data));
  }
  for (const host of getIngestHosts()) {
    fetch(`http://${host}:7775${INGEST_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": SESSION_ID,
      },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
  // #endregion
}

if (__DEV__) {
  console.warn(`[DBG:BOOT] debugLog ready hosts=${getIngestHosts().join(",")}`);
}
