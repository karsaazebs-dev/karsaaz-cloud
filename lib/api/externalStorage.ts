// External storage admin (files_external app).
// RESTful resource at /index.php/apps/files_external/globalstorages.
// Non-OCS AppFramework JSON endpoints; CSRF bypassed via Basic auth.
//
// Backend + auth identifiers and option keys verified against the server source
// (apps/files_external/lib/Lib/Backend/*.php and .../Lib/Auth/*):
//   dav       → backendOptions { host, root, secure }                                     + password::password   { user, password }
//   smb       → backendOptions { host, share, root, domain }                              + password::password   { user, password }
//   local     → backendOptions { datadir }                                                + null::null           (no credentials)
//   sftp      → backendOptions { host, port, root }                                       + password::password   { user, password }
//   ftp       → backendOptions { host, root, secure }                                     + password::password   { user, password }
//   owncloud  → backendOptions { host, root, secure }                                     + password::password   { user, password }
//   amazons3  → backendOptions { bucket, hostname, port, region, use_ssl, use_path_style, legacy_auth }
//                                                                                          + amazons3::accesskey  { key, secret }

import { apiFetch } from "./client";

const BASE = "/index.php/apps/files_external/globalstorages";

export interface ExternalStorage {
  id: number;
  mountPoint: string;
  backend: string;
  authMechanism: string;
  backendOptions: Record<string, unknown>;
  priority?: number;
  applicableUsers?: string[];
  applicableGroups?: string[];
  mountOptions?: Record<string, unknown>;
  /** 0 = OK, other = error/indeterminate */
  status?: number;
  statusMessage?: string;
}

export type ExternalStorageBackend =
  | "dav"
  | "smb"
  | "local"
  | "sftp"
  | "ftp"
  | "owncloud"
  | "amazons3";

export interface CreateExternalStoragePayload {
  mountPoint: string;
  backend: ExternalStorageBackend;
  authMechanism: string;
  backendOptions: Record<string, unknown>;
  mountOptions?: Record<string, unknown>;
  applicableUsers?: string[];
  applicableGroups?: string[];
  priority?: number;
}

interface AuthOptions {
  basicAuth: string;
}

export async function listExternalStorages(
  opts: AuthOptions
): Promise<ExternalStorage[]> {
  const data = await apiFetch<ExternalStorage[]>(BASE, { basicAuth: opts.basicAuth });
  return Array.isArray(data) ? data : [];
}

export async function createExternalStorage(
  opts: AuthOptions,
  payload: CreateExternalStoragePayload
): Promise<ExternalStorage> {
  return apiFetch<ExternalStorage>(BASE, {
    method: "POST",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mountOptions: {},
      applicableUsers: [],
      applicableGroups: [],
      priority: 100,
      ...payload,
    }),
  });
}

export async function deleteExternalStorage(
  opts: AuthOptions,
  id: number
): Promise<void> {
  await apiFetch(`${BASE}/${id}`, {
    method: "DELETE",
    basicAuth: opts.basicAuth,
  });
}
