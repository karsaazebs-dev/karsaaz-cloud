// Admin delegation (settings app) — grant groups access to specific admin
// settings sections. Data is server-injected initial state on the delegation
// admin page; saving posts the full group set for a settings class.
// Save URL verified live (405 on GET): /index.php/apps/settings/settings/authorizedgroups/saveSettings

import { apiFetch } from "./client";

const PAGE = "/api/proxy/index.php/settings/admin/admindelegation";
const SAVE_URL = "/index.php/apps/settings/settings/authorizedgroups/saveSettings";

export interface DelegationSetting {
  class: string;
  sectionName: string;
  id: string;
  priority: number;
}

export interface DelegationGroup {
  gid: string;
  displayName: string;
}

export interface AuthorizedGroupEntry {
  id: number;
  class: string;
  groupId?: string;
  group_id?: string;
}

export interface DelegationData {
  settings: DelegationSetting[];
  groups: DelegationGroup[];
  authorized: AuthorizedGroupEntry[];
}

interface AuthOptions {
  basicAuth: string;
}

function decode<T>(doc: Document, key: string, fallback: T): T {
  const el = doc.getElementById(`initial-state-settings-${key}`);
  const b64 = el?.getAttribute("value");
  if (!b64) return fallback;
  try {
    return JSON.parse(atob(b64)) as T;
  } catch {
    return fallback;
  }
}

/** The group id of an authorized-group entry, tolerant of camel/snake case. */
export function authGroupId(entry: AuthorizedGroupEntry): string {
  return entry.groupId ?? entry.group_id ?? "";
}

export async function getDelegationData(opts: AuthOptions): Promise<DelegationData> {
  const res = await fetch(PAGE, { headers: { Authorization: `Basic ${opts.basicAuth}` } });
  if (!res.ok) throw new Error(`Failed to load delegation settings (${res.status})`);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  return {
    settings: decode<DelegationSetting[]>(doc, "available-settings", []),
    groups: decode<DelegationGroup[]>(doc, "available-groups", []),
    authorized: decode<AuthorizedGroupEntry[]>(doc, "authorized-groups", []),
  };
}

/** Replace the full set of authorized groups for one settings class. */
export async function saveAuthorizedGroups(
  opts: AuthOptions,
  className: string,
  gids: string[]
): Promise<void> {
  await apiFetch(SAVE_URL, {
    method: "POST",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newGroups: gids.map((gid) => ({ gid })), class: className }),
  });
}
