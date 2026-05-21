// Admin activity notification defaults (activity app).
//
// The activity admin settings page has no JSON read API — the current state is
// emitted as initial state on the rendered settings page. We fetch that page
// and decode the relevant `initial-state-activity-*` entries.
//
// Saving DOES work: POST /index.php/apps/activity/settings/admin accepts
// form-encoded `<typeId>_email` / `<typeId>_notification` flags (value "1").
// Verified against the live backend: each toggled type persists, and any flag
// that is OMITTED from the POST is reset to false (HTML-checkbox semantics).
// Therefore the save MUST send the full state of every toggleable type.
//
// The per-user "send batched emails every N hours" (setting_batchtime) is a
// PERSONAL setting and is NOT writable through the admin endpoint (verified:
// the admin POST ignores it), so it is surfaced read-only here.

import { apiFetch } from "./client";
import { fetchSecurityPageState } from "./initialState";

/** Admin activity settings page (carries the initial state). */
export const ADMIN_ACTIVITY_PAGE = "/index.php/settings/admin/activity";
/** Admin save endpoint (POST-only; verified 200 on POST, 405 on GET). */
export const ADMIN_SAVE_PATH = "/index.php/apps/activity/settings/admin";

/** Personal notifications settings page (same activity initial-state). */
export const PERSONAL_NOTIFICATIONS_PAGE = "/index.php/settings/user/notifications";
/** Personal save endpoint (the user's own activity notification prefs). */
export const PERSONAL_SAVE_PATH = "/index.php/apps/activity/settings";

interface AuthOptions {
  basicAuth: string;
}

/** A single activity type within a group (e.g. "file_changed"). */
export interface ActivityType {
  /** Stable id used as the POST param prefix, e.g. "file_changed". */
  id: string;
  /** HTML description (may contain <strong> markup). */
  desc: string;
  /** Whether email delivery is enabled by default for this type. */
  email: boolean;
  /** Whether push/notification delivery is enabled by default. */
  notification: boolean;
  /** Delivery methods this type supports, e.g. ["email","notification"]. */
  methods: string[];
}

/** A named group of activity types (e.g. "Files", "Sharing"). */
export interface ActivityGroup {
  /** Stable group key, e.g. "files". */
  id: string;
  /** Human-readable group name, e.g. "Files". */
  name: string;
  types: ActivityType[];
}

/** Available delivery methods, e.g. { email: "Mail", notification: "Push" }. */
export type ActivityMethods = Record<string, string>;

export interface ActivitySettings {
  groups: ActivityGroup[];
  /** Method id -> label. */
  methods: ActivityMethods;
  /** Whether a mail server is configured (email delivery actually works). */
  isEmailSet: boolean;
  /** Whether email delivery is enabled instance-wide. */
  emailEnabled: boolean;
  /** Per-user batched-email interval in seconds (read-only on admin page). */
  batchtime: number;
  /** True when the per-type defaults can be persisted (always true here). */
  canSave: boolean;
}

/** Raw shape of one activity_groups entry as emitted by the backend. */
interface RawGroup {
  name: string;
  activities: Record<
    string,
    { desc: string; email: boolean; notification: boolean; methods: string[] }
  >;
}

export async function getActivitySettings(
  opts: AuthOptions,
  page: string = ADMIN_ACTIVITY_PAGE
): Promise<ActivitySettings> {
  const [rawGroups, methods, isEmailSet, emailEnabled, batchtime] =
    await Promise.all([
      fetchSecurityPageState<Record<string, RawGroup>>(
        "activity-activity_groups",
        opts.basicAuth,
        page
      ),
      fetchSecurityPageState<ActivityMethods>("activity-methods", opts.basicAuth, page),
      fetchSecurityPageState<boolean>("activity-is_email_set", opts.basicAuth, page),
      fetchSecurityPageState<boolean>("activity-email_enabled", opts.basicAuth, page),
      fetchSecurityPageState<number>("activity-setting_batchtime", opts.basicAuth, page),
    ]);

  const groups: ActivityGroup[] = Object.entries(rawGroups ?? {}).map(
    ([groupId, group]) => ({
      id: groupId,
      name: group.name,
      types: Object.entries(group.activities ?? {}).map(([typeId, t]) => ({
        id: typeId,
        desc: t.desc,
        email: !!t.email,
        notification: !!t.notification,
        methods: t.methods ?? [],
      })),
    })
  );

  return {
    groups,
    methods: methods ?? {},
    isEmailSet: !!isEmailSet,
    emailEnabled: !!emailEnabled,
    batchtime: typeof batchtime === "number" ? batchtime : 0,
    canSave: true,
  };
}

/**
 * Persist the per-type email/notification defaults.
 *
 * The backend resets any omitted flag to false, so callers must pass the FULL
 * current state of every toggleable type.
 */
export async function saveActivitySettings(
  opts: AuthOptions,
  groups: ActivityGroup[],
  savePath: string = ADMIN_SAVE_PATH
): Promise<void> {
  const form = new URLSearchParams();
  for (const group of groups) {
    for (const type of group.types) {
      if (type.methods.includes("email") && type.email) {
        form.set(`${type.id}_email`, "1");
      }
      if (type.methods.includes("notification") && type.notification) {
        form.set(`${type.id}_notification`, "1");
      }
    }
  }

  await apiFetch(savePath, {
    method: "POST",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
}
