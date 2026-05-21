// Personal external storage (files_external app).
// RESTful resource at /index.php/apps/files_external/userstorages — lets a user
// mount their own storage. Mirrors the admin globalstorages resource but scoped
// to the current user; same StorageConfig shape and create payload.
//
// Backend + auth identifiers / option keys are identical to the admin version
// (see lib/api/externalStorage.ts for the full mapping). Types are reused from
// there to avoid duplication.

import { apiFetch } from "./client";
import type {
  ExternalStorage,
  CreateExternalStoragePayload,
} from "./externalStorage";

const BASE = "/index.php/apps/files_external/userstorages";

interface AuthOptions {
  basicAuth: string;
}

export async function listUserStorages(
  opts: AuthOptions
): Promise<ExternalStorage[]> {
  const data = await apiFetch<ExternalStorage[]>(BASE, { basicAuth: opts.basicAuth });
  return Array.isArray(data) ? data : [];
}

export async function createUserStorage(
  opts: AuthOptions,
  payload: CreateExternalStoragePayload
): Promise<ExternalStorage> {
  return apiFetch<ExternalStorage>(BASE, {
    method: "POST",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mountOptions: {},
      priority: 100,
      ...payload,
    }),
  });
}

export async function deleteUserStorage(
  opts: AuthOptions,
  id: number
): Promise<void> {
  await apiFetch(`${BASE}/${id}`, {
    method: "DELETE",
    basicAuth: opts.basicAuth,
  });
}
