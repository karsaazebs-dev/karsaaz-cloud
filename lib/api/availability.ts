// Availability / out-of-office API typed client (dav app)

import { apiFetch, ApiError } from "./client";
import type { OCSResponse } from "@/lib/types/ocs.types";

interface OCSOptions {
  basicAuth: string;
}

/** Out-of-office (absence) data as returned by the dav OutOfOfficeController. */
export interface OutOfOfficeData {
  id: string;
  userId: string;
  firstDay: string;
  lastDay: string;
  status: string;
  message: string;
  replacementUserId: string | null;
  replacementUserDisplayName: string | null;
}

export interface SetOutOfOfficePayload {
  firstDay: string;
  lastDay: string;
  status: string;
  message: string;
  replacementUserId?: string;
}

const OUT_OF_OFFICE_BASE = "/ocs/v2.php/apps/dav/api/v1/outOfOffice";

/**
 * Get the configured out-of-office data for a user.
 * Returns `null` when no absence is configured (the backend responds 404).
 */
export async function getOutOfOffice(
  opts: OCSOptions,
  userId: string
): Promise<OutOfOfficeData | null> {
  try {
    const data = await apiFetch<OCSResponse<OutOfOfficeData>>(
      `${OUT_OF_OFFICE_BASE}/${encodeURIComponent(userId)}?format=json`,
      { basicAuth: opts.basicAuth }
    );
    return data.ocs.data;
  } catch (e) {
    if (e instanceof ApiError && e.isNotFound) {
      return null;
    }
    throw e;
  }
}

export async function setOutOfOffice(
  opts: OCSOptions,
  userId: string,
  payload: SetOutOfOfficePayload
): Promise<OutOfOfficeData> {
  const data = await apiFetch<OCSResponse<OutOfOfficeData>>(
    `${OUT_OF_OFFICE_BASE}/${encodeURIComponent(userId)}?format=json`,
    {
      method: "POST",
      basicAuth: opts.basicAuth,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return data.ocs.data;
}

export async function clearOutOfOffice(
  opts: OCSOptions,
  userId: string
): Promise<void> {
  await apiFetch(
    `${OUT_OF_OFFICE_BASE}/${encodeURIComponent(userId)}?format=json`,
    { method: "DELETE", basicAuth: opts.basicAuth }
  );
}
