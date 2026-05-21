// Admin "Artificial intelligence" settings (settings app, admin).
//
// All the data is exposed as initial state on the admin AI page
// (`/index.php/settings/admin/ai`, app id "settings"). There is no JSON GET —
// we fetch the rendered page and decode each `initial-state-settings-<key>`
// entry, mirroring how the Vue admin component reads it via loadState().
//
// Saving goes through the AppFramework JSON route
// `PUT /index.php/settings/api/admin/ai` (AISettingsController::update),
// which writes the provider-preference appValues under the `core` app.
// CSRF is bypassed via Basic auth (same as the other settings setters).
//
// On an air-gapped server there are usually no AI providers installed, so most
// of these arrays/maps come back empty — the UI degrades to an empty state.

import { apiFetch } from "./client";
import { fetchSecurityPageState } from "./initialState";

/** Admin AI settings page (provider lists + current preferences). */
export const ADMIN_AI_PAGE = "/index.php/settings/admin/ai";

interface AuthOptions {
  basicAuth: string;
}

/** Speech-to-text / translation / text-processing provider (class-based id). */
export interface AiClassProvider {
  class: string;
  name: string;
  /** Only present on text-processing providers. */
  taskType?: string;
}

/** Text-to-image / task-processing provider (string id). */
export interface AiIdProvider {
  id: string;
  name: string;
  /** Only present on task-processing providers. */
  taskType?: string;
}

/** Text-processing task type (class-based). */
export interface AiClassTaskType {
  class: string;
  name: string;
  description: string;
}

/** Task-processing task type (string id). */
export interface AiIdTaskType {
  id: string;
  name: string;
  description: string;
}

/**
 * The current selected-provider map (`ai-settings` initial state). Mirrors the
 * appValues stored under the `core` app. Values may be null/empty when no
 * providers are installed.
 */
export interface AiSettingsMap {
  "ai.stt_provider": string | null;
  /** Ordered list of translation provider preferences (most preferred first). */
  "ai.translation_provider_preferences": string[];
  /** task-type class -> provider class. */
  "ai.textprocessing_provider_preferences": Record<string, string>;
  "ai.text2image_provider": string | null;
  /** task-type id -> provider id. */
  "ai.taskprocessing_provider_preferences": Record<string, string>;
}

export interface AiSettings {
  sttProviders: AiClassProvider[];
  translationProviders: AiClassProvider[];
  textProcessingProviders: AiClassProvider[];
  textProcessingTaskTypes: AiClassTaskType[];
  text2imageProviders: AiIdProvider[];
  taskProcessingProviders: AiIdProvider[];
  taskProcessingTaskTypes: AiIdTaskType[];
  settings: AiSettingsMap;
}

const EMPTY_SETTINGS: AiSettingsMap = {
  "ai.stt_provider": null,
  "ai.translation_provider_preferences": [],
  "ai.textprocessing_provider_preferences": {},
  "ai.text2image_provider": null,
  "ai.taskprocessing_provider_preferences": {},
};

/** Fetch the admin AI page once and decode all initial-state keys into a typed object. */
export async function getAiSettings(opts: AuthOptions): Promise<AiSettings> {
  const [
    sttProviders,
    translationProviders,
    textProcessingProviders,
    textProcessingTaskTypes,
    text2imageProviders,
    taskProcessingProviders,
    taskProcessingTaskTypes,
    settings,
  ] = await Promise.all([
    fetchSecurityPageState<AiClassProvider[]>("settings-ai-stt-providers", opts.basicAuth, ADMIN_AI_PAGE),
    fetchSecurityPageState<AiClassProvider[]>("settings-ai-translation-providers", opts.basicAuth, ADMIN_AI_PAGE),
    fetchSecurityPageState<AiClassProvider[]>("settings-ai-text-processing-providers", opts.basicAuth, ADMIN_AI_PAGE),
    fetchSecurityPageState<AiClassTaskType[]>("settings-ai-text-processing-task-types", opts.basicAuth, ADMIN_AI_PAGE),
    fetchSecurityPageState<AiIdProvider[]>("settings-ai-text2image-providers", opts.basicAuth, ADMIN_AI_PAGE),
    fetchSecurityPageState<AiIdProvider[]>("settings-ai-task-processing-providers", opts.basicAuth, ADMIN_AI_PAGE),
    fetchSecurityPageState<AiIdTaskType[]>("settings-ai-task-processing-task-types", opts.basicAuth, ADMIN_AI_PAGE),
    fetchSecurityPageState<AiSettingsMap>("settings-ai-settings", opts.basicAuth, ADMIN_AI_PAGE),
  ]);

  return {
    sttProviders: sttProviders ?? [],
    translationProviders: translationProviders ?? [],
    textProcessingProviders: textProcessingProviders ?? [],
    textProcessingTaskTypes: textProcessingTaskTypes ?? [],
    text2imageProviders: text2imageProviders ?? [],
    taskProcessingProviders: taskProcessingProviders ?? [],
    taskProcessingTaskTypes: taskProcessingTaskTypes ?? [],
    settings: { ...EMPTY_SETTINGS, ...(settings ?? {}) },
  };
}

/**
 * Persist a partial set of AI provider preferences.
 *
 * The controller (AISettingsController::update) only writes keys that are
 * present in `settings`, json-encoding each into the matching `core` appValue,
 * so callers may pass just the keys they changed.
 */
export async function saveAiSettings(
  opts: AuthOptions,
  settings: Partial<AiSettingsMap>
): Promise<void> {
  await apiFetch("/index.php/settings/api/admin/ai", {
    method: "PUT",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings }),
  });
}
