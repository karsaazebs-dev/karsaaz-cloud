/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Raw API calls to the karsaaz_quota Nextcloud app.
 * All routes are under /ocs/v2.php/apps/karsaaz_quota/api/v1/
 */

const OCS_BASE = "/ocs/v2.php/apps/karsaaz_quota/api/v1";

function ocsHeaders(basicAuth: string) {
  return {
    Authorization: `Basic ${basicAuth}`,
    "OCS-APIREQUEST": "true",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function ocsJson(serverUrl: string, basicAuth: string, path: string, opts?: RequestInit) {
  const url = `${serverUrl}${OCS_BASE}${path}`;
  const res = await fetch(url, { ...opts, headers: ocsHeaders(basicAuth) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json?.ocs?.meta?.status !== "ok") {
    throw new Error(json?.ocs?.meta?.message ?? "OCS error");
  }
  return json.ocs.data;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PoolInfo {
  total_bytes: number;
  distributed_bytes: number;
  available_bytes: number;
}

export interface ManagedUser {
  uid: string;
  displayName: string;
  allocated_bytes: number;
  used_bytes: number;
  updated_at: number;
}

export interface QuotaRequest {
  id: string;
  requester_uid: string;
  current_bytes: number;
  requested_bytes: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewer_uid: string | null;
  created_at: number;
  updated_at: number;
}

// ── Pool ──────────────────────────────────────────────────────────────────────

export async function getPool(serverUrl: string, basicAuth: string): Promise<PoolInfo> {
  return ocsJson(serverUrl, basicAuth, "/pool");
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getManagedUsers(serverUrl: string, basicAuth: string): Promise<ManagedUser[]> {
  const data = await ocsJson(serverUrl, basicAuth, "/users");
  return data.users ?? [];
}

// ── Allocation ────────────────────────────────────────────────────────────────

export async function allocateQuota(
  serverUrl: string,
  basicAuth: string,
  uid: string,
  bytes: number
): Promise<void> {
  await ocsJson(serverUrl, basicAuth, `/allocate/${encodeURIComponent(uid)}`, {
    method: "PUT",
    body: JSON.stringify({ bytes }),
  });
}

// ── Requests ──────────────────────────────────────────────────────────────────

export async function getQuotaRequests(serverUrl: string, basicAuth: string): Promise<QuotaRequest[]> {
  const data = await ocsJson(serverUrl, basicAuth, "/requests");
  return data.requests ?? [];
}

export async function createQuotaRequest(
  serverUrl: string,
  basicAuth: string,
  currentBytes: number,
  requestedBytes: number,
  reason: string
): Promise<string> {
  const data = await ocsJson(serverUrl, basicAuth, "/requests", {
    method: "POST",
    body: JSON.stringify({
      current_bytes: currentBytes,
      requested_bytes: requestedBytes,
      reason,
    }),
  });
  return data.id as string;
}

export async function reviewQuotaRequest(
  serverUrl: string,
  basicAuth: string,
  requestId: string,
  status: "approved" | "rejected"
): Promise<void> {
  await ocsJson(serverUrl, basicAuth, `/requests/${encodeURIComponent(requestId)}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}
