// Helper to read server-injected initial state from a rendered Nextcloud page.
//
// Several personal-settings data sets (app tokens, two-factor state) have no
// JSON API — they are emitted as <input id="initial-state-{app}-{key}"
// value="base64(json)"> on the settings page. We fetch that page and decode it,
// which mirrors exactly how the backend exposes the data.

/** Personal security settings page (app tokens, two-factor state). */
export const PERSONAL_SECURITY_PAGE = "/index.php/settings/user/security";
/** Admin security settings page (OAuth2 clients). */
export const ADMIN_SECURITY_PAGE = "/index.php/settings/admin/security";

/**
 * Fetch a rendered settings page and decode one initial-state entry.
 * @param id the full `{app}-{key}` id, e.g. "settings-app_tokens".
 * @param basicAuth base64 credentials.
 * @param page backend page path (defaults to the personal security page).
 */
export async function fetchSecurityPageState<T>(
  id: string,
  basicAuth: string,
  page: string = PERSONAL_SECURITY_PAGE
): Promise<T | null> {
  const res = await fetch(`/api/proxy${page}`, {
    headers: { Authorization: `Basic ${basicAuth}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to load settings page (${res.status})`);
  }
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const el = doc.getElementById(`initial-state-${id}`);
  const b64 = el?.getAttribute("value");
  if (!b64) return null;
  try {
    return JSON.parse(atob(b64)) as T;
  } catch {
    return null;
  }
}
