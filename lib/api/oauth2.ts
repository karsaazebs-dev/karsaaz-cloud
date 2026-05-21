// OAuth2 client management (oauth2 app, admin).
// The client list is initial state on the admin security page; create/delete
// are AppFramework JSON routes (CSRF bypassed via Basic auth).

import { apiFetch } from "./client";
import { fetchSecurityPageState, ADMIN_SECURITY_PAGE } from "./initialState";

export interface OAuth2Client {
  id: number;
  name: string;
  redirectUri: string;
  clientId: string;
  /** Only populated in the response of a freshly created client. */
  clientSecret: string;
}

interface AuthOptions {
  basicAuth: string;
}

export async function listOAuth2Clients(
  opts: AuthOptions
): Promise<OAuth2Client[]> {
  const clients = await fetchSecurityPageState<OAuth2Client[]>(
    "oauth2-clients",
    opts.basicAuth,
    ADMIN_SECURITY_PAGE
  );
  return Array.isArray(clients) ? clients : [];
}

export async function createOAuth2Client(
  opts: AuthOptions,
  name: string,
  redirectUri: string
): Promise<OAuth2Client> {
  return apiFetch<OAuth2Client>("/index.php/apps/oauth2/clients", {
    method: "POST",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, redirectUri }),
  });
}

export async function deleteOAuth2Client(
  opts: AuthOptions,
  id: number
): Promise<void> {
  await apiFetch(`/index.php/apps/oauth2/clients/${id}`, {
    method: "DELETE",
    basicAuth: opts.basicAuth,
  });
}
