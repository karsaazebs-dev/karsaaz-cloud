// Personal sharing settings (files_sharing app).
// Current values are server-injected initial state on the personal sharing page;
// writes go to the files_sharing Settings controller (CSRF bypassed via Basic auth).

import { apiFetch } from "./client";

const PAGE = "/api/proxy/index.php/settings/user/sharing";

export interface PersonalSharingSettings {
  acceptDefault: boolean;
  enforceAccept: boolean;
  allowCustomShareFolder: boolean;
  defaultShareFolder: string;
  shareFolder: string;
}

interface AuthOptions {
  basicAuth: string;
}

function decode<T>(doc: Document, key: string, fallback: T): T {
  const el = doc.getElementById(`initial-state-files_sharing-${key}`);
  const b64 = el?.getAttribute("value");
  if (!b64) return fallback;
  try {
    return JSON.parse(atob(b64)) as T;
  } catch {
    return fallback;
  }
}

export async function getPersonalSharingSettings(
  opts: AuthOptions
): Promise<PersonalSharingSettings> {
  const res = await fetch(PAGE, { headers: { Authorization: `Basic ${opts.basicAuth}` } });
  if (!res.ok) throw new Error(`Failed to load sharing settings (${res.status})`);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  return {
    acceptDefault: decode(doc, "accept_default", true),
    enforceAccept: decode(doc, "enforce_accept", false),
    allowCustomShareFolder: decode(doc, "allow_custom_share_folder", false),
    defaultShareFolder: decode(doc, "default_share_folder", "/"),
    shareFolder: decode(doc, "share_folder", ""),
  };
}

export async function setDefaultAccept(opts: AuthOptions, accept: boolean): Promise<void> {
  await apiFetch("/index.php/apps/files_sharing/settings/defaultAccept", {
    method: "PUT",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accept }),
  });
}

export async function setShareFolder(opts: AuthOptions, shareFolder: string): Promise<void> {
  await apiFetch("/index.php/apps/files_sharing/settings/shareFolder", {
    method: "PUT",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shareFolder }),
  });
}

export async function resetShareFolder(opts: AuthOptions): Promise<void> {
  await apiFetch("/index.php/apps/files_sharing/settings/shareFolder", {
    method: "DELETE",
    basicAuth: opts.basicAuth,
  });
}
