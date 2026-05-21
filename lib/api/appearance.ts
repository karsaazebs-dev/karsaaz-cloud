// Appearance / theming (theming app).
//
// The list of themes and their enabled state has no dedicated JSON API — it is
// emitted as initial state on the personal appearance settings page. Enabling
// and disabling themes are OCS routes on the theming app.

import { apiFetch } from "./client";
import { fetchSecurityPageState } from "./initialState";

/** Personal appearance / theming settings page. */
export const PERSONAL_THEMING_PAGE = "/index.php/settings/user/theming";

/** ITheme::TYPE_THEME / TYPE_FONT (see apps/theming/lib/ITheme.php). */
export const THEME_TYPE_THEME = 1;
export const THEME_TYPE_FONT = 2;

export interface Theme {
  id: string;
  /** 1 = appearance theme (mutually exclusive), 2 = font/accessibility toggle. */
  type: number;
  title: string;
  enableLabel: string;
  description: string;
  enabled: boolean;
}

interface AuthOptions {
  basicAuth: string;
}

export async function getThemes(opts: AuthOptions): Promise<Theme[]> {
  const themes = await fetchSecurityPageState<Theme[]>(
    "theming-themes",
    opts.basicAuth,
    PERSONAL_THEMING_PAGE
  );
  return themes ?? [];
}

export async function enableTheme(
  opts: AuthOptions,
  themeId: string
): Promise<void> {
  await apiFetch(
    `/ocs/v2.php/apps/theming/api/v1/theme/${encodeURIComponent(themeId)}/enable?format=json`,
    { method: "PUT", basicAuth: opts.basicAuth }
  );
}

export async function disableTheme(
  opts: AuthOptions,
  themeId: string
): Promise<void> {
  await apiFetch(
    `/ocs/v2.php/apps/theming/api/v1/theme/${encodeURIComponent(themeId)}?format=json`,
    { method: "DELETE", basicAuth: opts.basicAuth }
  );
}
