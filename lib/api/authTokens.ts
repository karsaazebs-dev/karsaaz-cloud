// Devices & sessions (app passwords) — settings app authtokens controller.
// Non-OCS AppFramework JSON endpoints under /settings/personal/authtokens.
// CSRF is bypassed because requests are Basic-auth authenticated (no session cookie).
//
// NOTE: There is intentionally no JSON "list" endpoint in Nextcloud. The token
// list is delivered as server-injected initial state on the security settings
// page (`provideInitialState('settings', 'app_tokens', …)`), rendered as a
// hidden <input id="initial-state-settings-app_tokens" value="base64(json)">.
// So we fetch that page and parse the initial state — this mirrors the backend.

import { apiFetch } from "./client";
import { fetchSecurityPageState } from "./initialState";

const BASE = "/settings/personal/authtokens";

/** App token / session as returned by the authtokens controller. */
export interface AuthToken {
  id: number;
  name: string;
  lastActivity: number;
  /** 0 = temporary session, 1 = permanent (app password / device) */
  type: number;
  scope: { filesystem?: boolean };
  current?: boolean;
  canDelete?: boolean;
  canRename?: boolean;
}

export interface CreatedAuthToken {
  token: string;
  loginName: string;
  deviceToken: AuthToken;
}

interface AuthOptions {
  basicAuth: string;
}

export async function listAuthTokens(opts: AuthOptions): Promise<AuthToken[]> {
  const tokens = await fetchSecurityPageState<AuthToken[]>(
    "settings-app_tokens",
    opts.basicAuth
  );
  return Array.isArray(tokens) ? tokens : [];
}

export async function createAuthToken(
  opts: AuthOptions,
  name: string
): Promise<CreatedAuthToken> {
  return apiFetch<CreatedAuthToken>(BASE, {
    method: "POST",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function renameAuthToken(
  opts: AuthOptions,
  id: number,
  name: string,
  scope: { filesystem?: boolean }
): Promise<void> {
  await apiFetch(`${BASE}/${id}`, {
    method: "PUT",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, scope }),
  });
}

export async function deleteAuthToken(
  opts: AuthOptions,
  id: number
): Promise<void> {
  await apiFetch(`${BASE}/${id}`, {
    method: "DELETE",
    basicAuth: opts.basicAuth,
  });
}
