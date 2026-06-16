/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Platform } from "react-native";
import Constants from "expo-constants";

const SESSION_ID = "91e975";
const INGEST_PATH = "/ingest/216c4bf8-607d-4564-8e62-d47b360e6c80";
const INGEST_PORT = 7440;

function getIngestHosts(): string[] {
  if (Platform.OS === "web") return ["127.0.0.1"];
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | null)?.debuggerHost;
  const lanHost = hostUri?.split(":")[0];
  return lanHost ? [lanHost, "127.0.0.1"] : ["127.0.0.1"];
}

export function phase1DebugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
  runId = "phase1-verify"
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

  if (__DEV__) {
    console.warn(`[DBG:${hypothesisId}] ${location} — ${message}`, JSON.stringify(data));
  }

  for (const host of getIngestHosts()) {
    fetch(`http://${host}:${INGEST_PORT}${INGEST_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": SESSION_ID,
      },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
}
