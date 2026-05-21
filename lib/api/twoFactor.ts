// Two-factor backup codes (twofactor_backupcodes app).
// State is exposed as initial state on the security page; (re)generation is a
// POST to the app's settings/create route (CSRF bypassed via Basic auth).

import { apiFetch } from "./client";
import { fetchSecurityPageState } from "./initialState";

export interface BackupCodesState {
  enabled: boolean;
  total: number;
  used: number;
}

interface AuthOptions {
  basicAuth: string;
}

export async function getBackupCodesState(
  opts: AuthOptions
): Promise<BackupCodesState> {
  const state = await fetchSecurityPageState<BackupCodesState>(
    "twofactor_backupcodes-state",
    opts.basicAuth
  );
  return state ?? { enabled: false, total: 0, used: 0 };
}

export interface CreatedBackupCodes {
  codes: string[];
  state: BackupCodesState;
}

export async function createBackupCodes(
  opts: AuthOptions
): Promise<CreatedBackupCodes> {
  return apiFetch<CreatedBackupCodes>(
    "/index.php/apps/twofactor_backupcodes/settings/create",
    {
      method: "POST",
      basicAuth: opts.basicAuth,
      headers: { "Content-Type": "application/json" },
    }
  );
}
