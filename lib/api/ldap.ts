// LDAP / AD integration (user_ldap app, admin).
//
// CRUD on server configurations goes through the OCS config API
// (/ocs/v2.php/apps/user_ldap/api/v1/config). There is no OCS "list" endpoint:
// the set of configuration prefixes is rendered into the admin LDAP settings
// page as <option> elements of <select id="ldap_serverconfig_chooser">, so we
// fetch that page, parse the prefixes, then GET each config.

import { apiFetch } from "./client";

const OCS_BASE = "/ocs/v2.php/apps/user_ldap/api/v1/config";
/** Admin LDAP settings page (renders the server-configuration chooser). */
const ADMIN_LDAP_PAGE = "/index.php/settings/admin/ldap";

interface AuthOptions {
  basicAuth: string;
}

interface OCSResponse<T> {
  ocs: { meta: { status: string; statuscode: number; message: string }; data: T };
}

/**
 * Raw configuration shape returned by the GET show endpoint. All values are
 * strings (the backend joins array fields with ";"). We only type the core
 * connection + filter fields the UI edits; the rest are passed through.
 */
export interface LdapConfigData {
  // Server
  ldapHost: string;
  ldapPort: string;
  ldapBase: string;
  ldapAgentName: string;
  ldapAgentPassword: string;
  ldapConfigurationActive: string;
  // Users
  ldapBaseUsers: string;
  ldapUserFilter: string;
  ldapUserFilterObjectclass: string;
  ldapUserDisplayName: string;
  ldapUserFilterGroups: string;
  // Login Attributes
  ldapLoginFilter: string;
  ldapLoginFilterUsername: string;
  ldapLoginFilterEmail: string;
  ldapLoginFilterAttributes: string;
  // Groups
  ldapBaseGroups: string;
  ldapGroupFilter: string;
  ldapGroupFilterObjectclass: string;
  ldapGroupDisplayName: string;
  ldapGroupMemberAssocAttr: string;
  // Advanced
  ldapTLS: string;
  ldapCacheTTL: string;
  ldapExpertUsernameAttr: string;
  ldapExpertUUIDUserAttr: string;
  ldapQuotaAttribute: string;
  ldapEmailAttribute: string;
  ldapUserAvatarRule: string;
  turnOffCertCheck: string;
  ldapPagingSize: string;
  [key: string]: string;
}

/** A server configuration, identified by its prefix (e.g. "s01"). */
export interface LdapConfig {
  id: string;
  config: LdapConfigData;
}

/** Subset of fields the UI can modify, sent in the PUT body's `configData`. */
export type LdapConfigInput = Partial<
  Pick<
    LdapConfigData,
    | "ldapHost"
    | "ldapPort"
    | "ldapBase"
    | "ldapAgentName"
    | "ldapAgentPassword"
    | "ldapConfigurationActive"
    | "ldapBaseUsers"
    | "ldapUserFilter"
    | "ldapUserFilterObjectclass"
    | "ldapUserDisplayName"
    | "ldapUserFilterGroups"
    | "ldapLoginFilter"
    | "ldapLoginFilterUsername"
    | "ldapLoginFilterEmail"
    | "ldapLoginFilterAttributes"
    | "ldapBaseGroups"
    | "ldapGroupFilter"
    | "ldapGroupFilterObjectclass"
    | "ldapGroupDisplayName"
    | "ldapGroupMemberAssocAttr"
    | "ldapTLS"
    | "ldapCacheTTL"
    | "ldapExpertUsernameAttr"
    | "ldapExpertUUIDUserAttr"
    | "ldapQuotaAttribute"
    | "ldapEmailAttribute"
    | "ldapUserAvatarRule"
    | "turnOffCertCheck"
    | "ldapPagingSize"
  >
>;

/** Fetch the admin LDAP page and parse the configuration prefixes from it. */
async function fetchConfigPrefixes(basicAuth: string): Promise<string[]> {
  const res = await fetch(`/api/proxy${ADMIN_LDAP_PAGE}`, {
    headers: { Authorization: `Basic ${basicAuth}` },
  });
  // 403/404 ⇒ the user_ldap app is not enabled; treat as "no configurations".
  if (res.status === 403 || res.status === 404) return [];
  if (!res.ok) {
    throw new Error(`Failed to load LDAP settings page (${res.status})`);
  }
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const select = doc.getElementById("ldap_serverconfig_chooser");
  if (!select) return [];
  const prefixes: string[] = [];
  select.querySelectorAll("option").forEach((opt) => {
    const value = opt.getAttribute("value");
    if (value !== null) prefixes.push(value);
  });
  return prefixes;
}

export async function getLdapConfig(
  opts: AuthOptions,
  id: string
): Promise<LdapConfig> {
  const data = await apiFetch<OCSResponse<LdapConfigData>>(
    `${OCS_BASE}/${encodeURIComponent(id)}?format=json`,
    { basicAuth: opts.basicAuth }
  );
  return { id, config: data.ocs.data };
}

export async function listLdapConfigs(
  opts: AuthOptions
): Promise<LdapConfig[]> {
  const prefixes = await fetchConfigPrefixes(opts.basicAuth);
  return Promise.all(prefixes.map((id) => getLdapConfig(opts, id)));
}

export async function createLdapConfig(opts: AuthOptions): Promise<string> {
  const data = await apiFetch<OCSResponse<{ configID: string }>>(
    `${OCS_BASE}?format=json`,
    {
      method: "POST",
      basicAuth: opts.basicAuth,
      headers: { "Content-Type": "application/json" },
    }
  );
  return data.ocs.data.configID;
}

export async function modifyLdapConfig(
  opts: AuthOptions,
  id: string,
  configData: LdapConfigInput
): Promise<void> {
  await apiFetch(`${OCS_BASE}/${encodeURIComponent(id)}?format=json`, {
    method: "PUT",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ configData }),
  });
}

export async function deleteLdapConfig(
  opts: AuthOptions,
  id: string
): Promise<void> {
  await apiFetch(`${OCS_BASE}/${encodeURIComponent(id)}?format=json`, {
    method: "DELETE",
    basicAuth: opts.basicAuth,
  });
}
