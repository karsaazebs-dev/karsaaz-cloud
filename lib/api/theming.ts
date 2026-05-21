// Theming admin (theming app) — official endpoints that also bump the theming
// cachebuster (unlike writing raw appconfig values). CSRF bypassed via Basic auth.

import { apiFetch } from "./client";

const AJAX = "/index.php/apps/theming/ajax";

export type ThemingSetting = "name" | "url" | "slogan" | "color" | "imprintUrl" | "privacyUrl";
export type ThemingImageKey = "logo" | "logoheader" | "background" | "favicon" | "header";

interface AuthOptions {
  basicAuth: string;
}

export async function updateThemingSetting(
  opts: AuthOptions,
  setting: ThemingSetting,
  value: string
): Promise<void> {
  await apiFetch(`${AJAX}/updateStylesheet`, {
    method: "POST",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ setting, value }),
  });
}

export async function undoThemingSetting(
  opts: AuthOptions,
  setting: ThemingSetting | ThemingImageKey
): Promise<void> {
  await apiFetch(`${AJAX}/undoChanges`, {
    method: "POST",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ setting }),
  });
}

export async function uploadThemingImage(
  opts: AuthOptions,
  key: ThemingImageKey,
  file: File
): Promise<void> {
  const form = new FormData();
  form.append("key", key);
  form.append("image", file);
  // No Content-Type header — the browser sets the multipart boundary.
  await apiFetch(`${AJAX}/uploadImage`, {
    method: "POST",
    basicAuth: opts.basicAuth,
    body: form,
  });
}
