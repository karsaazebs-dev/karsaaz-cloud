// Server / basic settings (settings app, admin).
//
// SMTP settings live in config.php system values, so there is no clean JSON
// GET — the form starts blank with placeholders. The setters are AppFramework
// JSON routes (CSRF bypassed via Basic auth); the controller injects params
// straight from the JSON request body.
//
// The background-jobs cron mode IS exposed as initial state on the admin
// server page (`initial-state-settings-backgroundJobsMode`), so we can read it.

import { apiFetch } from "./client";
import { fetchSecurityPageState } from "./initialState";

/** Admin server settings page (background jobs initial state). */
export const ADMIN_SERVER_PAGE = "/index.php/settings/admin/server";

interface AuthOptions {
  basicAuth: string;
}

export type MailSmtpMode = "smtp" | "sendmail" | "qmail";
export type MailSmtpSecure = "" | "ssl" | "tls";

export interface MailSettingsPayload {
  mail_domain: string;
  mail_from_address: string;
  mail_smtpmode: MailSmtpMode;
  mail_smtpsecure: MailSmtpSecure;
  mail_smtphost: string;
  /** 1 when SMTP authentication is required, 0 otherwise. */
  mail_smtpauth: number;
  mail_smtpport: string;
  mail_sendmailmode: string;
}

export interface MailCredentialsPayload {
  mail_smtpname: string;
  mail_smtppassword: string;
}

/** Persist the SMTP / mail server settings (config.php system values). */
export async function setMailSettings(
  opts: AuthOptions,
  payload: MailSettingsPayload
): Promise<void> {
  await apiFetch("/index.php/settings/admin/mailsettings", {
    method: "POST",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** Store the SMTP credentials (username + password). */
export async function setMailCredentials(
  opts: AuthOptions,
  payload: MailCredentialsPayload
): Promise<void> {
  await apiFetch("/index.php/settings/admin/mailsettings/credentials", {
    method: "POST",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** Send a test email to the current admin's account email. */
export async function sendTestMail(opts: AuthOptions): Promise<void> {
  await apiFetch("/index.php/settings/admin/mailtest", {
    method: "POST",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

/** Read the configured background-jobs cron mode (ajax | webcron | cron). */
export async function getBackgroundJobsMode(
  opts: AuthOptions
): Promise<string | null> {
  return fetchSecurityPageState<string>(
    "settings-backgroundJobsMode",
    opts.basicAuth,
    ADMIN_SERVER_PAGE
  );
}
