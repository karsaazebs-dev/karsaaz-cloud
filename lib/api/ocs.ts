// OCS API typed client

import { apiFetch, ApiError } from "./client";
import type {
  OCSResponse,
  OCSUser,
  OCSCapabilities,
  OCSShare,
  OCSActivity,
  OCSNotification,
  OCSShareeResponse,
  OCSUserStatus,
  OCSPredefinedStatus,
  UserStatusType,
  OCSWeatherLocation,
  OCSWeatherForecast,
  WorkflowOperation,
  WorkflowsByClass,
  CreateWorkflowPayload,
} from "@/lib/types/ocs.types";

interface OCSOptions {
  basicAuth: string;
}

// ── Current User ──────────────────────────────────────────────────────────────

export async function getCurrentUser(opts: OCSOptions): Promise<OCSUser> {
  const data = await apiFetch<OCSResponse<OCSUser>>(
    "/ocs/v2.php/cloud/user?format=json",
    {
      basicAuth: opts.basicAuth,
      headers: { "OCS-APIREQUEST": "true" },
    }
  );
  return data.ocs.data;
}

// ── Users (admin) ─────────────────────────────────────────────────────────────

export async function listUsers(
  opts: OCSOptions,
  params?: { search?: string; limit?: number; offset?: number }
): Promise<string[]> {
  const query = new URLSearchParams({ format: "json" });
  if (params?.search) query.set("search", params.search);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));

  const data = await apiFetch<OCSResponse<{ users: string[] }>>(
    `/ocs/v2.php/cloud/users?${query}`,
    { basicAuth: opts.basicAuth }
  );
  return data.ocs.data.users;
}

export async function getUser(
  opts: OCSOptions,
  userId: string
): Promise<OCSUser> {
  const data = await apiFetch<OCSResponse<OCSUser>>(
    `/ocs/v2.php/cloud/users/${encodeURIComponent(userId)}?format=json`,
    { basicAuth: opts.basicAuth }
  );
  return data.ocs.data;
}

export async function createUser(
  opts: OCSOptions,
  payload: {
    userid: string;
    password: string;
    displayName?: string;
    email?: string;
    groups?: string[];
    quota?: string;
  }
): Promise<void> {
  await apiFetch("/ocs/v2.php/cloud/users?format=json", {
    method: "POST",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateUser(
  opts: OCSOptions,
  userId: string,
  key: string,
  value: string
): Promise<void> {
  await apiFetch(
    `/ocs/v2.php/cloud/users/${encodeURIComponent(userId)}?format=json`,
    {
      method: "PUT",
      basicAuth: opts.basicAuth,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    }
  );
}

export async function deleteUser(
  opts: OCSOptions,
  userId: string
): Promise<void> {
  await apiFetch(
    `/ocs/v2.php/cloud/users/${encodeURIComponent(userId)}?format=json`,
    { method: "DELETE", basicAuth: opts.basicAuth }
  );
}

export async function enableUser(
  opts: OCSOptions,
  userId: string
): Promise<void> {
  await apiFetch(
    `/ocs/v2.php/cloud/users/${encodeURIComponent(userId)}/enable?format=json`,
    { method: "PUT", basicAuth: opts.basicAuth }
  );
}

export async function disableUser(
  opts: OCSOptions,
  userId: string
): Promise<void> {
  await apiFetch(
    `/ocs/v2.php/cloud/users/${encodeURIComponent(userId)}/disable?format=json`,
    { method: "PUT", basicAuth: opts.basicAuth }
  );
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function listGroups(
  opts: OCSOptions,
  search?: string
): Promise<string[]> {
  const query = new URLSearchParams({ format: "json" });
  if (search) query.set("search", search);

  const data = await apiFetch<OCSResponse<{ groups: string[] }>>(
    `/ocs/v2.php/cloud/groups?${query}`,
    { basicAuth: opts.basicAuth }
  );
  return data.ocs.data.groups;
}

export async function createGroup(
  opts: OCSOptions,
  groupId: string
): Promise<void> {
  await apiFetch("/ocs/v2.php/cloud/groups?format=json", {
    method: "POST",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ groupid: groupId }),
  });
}

export async function deleteGroup(
  opts: OCSOptions,
  groupId: string
): Promise<void> {
  await apiFetch(
    `/ocs/v2.php/cloud/groups/${encodeURIComponent(groupId)}?format=json`,
    { method: "DELETE", basicAuth: opts.basicAuth }
  );
}

// ── Capabilities ──────────────────────────────────────────────────────────────

export async function getCapabilities(
  opts: OCSOptions
): Promise<OCSCapabilities> {
  const data = await apiFetch<OCSResponse<OCSCapabilities>>(
    "/ocs/v2.php/cloud/capabilities?format=json",
    { basicAuth: opts.basicAuth }
  );
  return data.ocs.data;
}

// ── Sharing ───────────────────────────────────────────────────────────────────

export async function listShares(
  opts: OCSOptions,
  params?: { path?: string; reshares?: boolean; subfiles?: boolean; shared_with_me?: boolean }
): Promise<OCSShare[]> {
  const query = new URLSearchParams({ format: "json" });
  if (params?.path) query.set("path", params.path);
  if (params?.reshares) query.set("reshares", "true");
  if (params?.subfiles) query.set("subfiles", "true");
  if (params?.shared_with_me) query.set("shared_with_me", "true");

  const data = await apiFetch<OCSResponse<OCSShare[]>>(
    `/ocs/v2.php/apps/files_sharing/api/v1/shares?${query}`,
    { basicAuth: opts.basicAuth }
  );
  return data.ocs.data;
}

export async function createShare(
  opts: OCSOptions,
  payload: {
    path: string;
    shareType: number;
    shareWith?: string;
    permissions?: number;
    password?: string;
    expireDate?: string;
    note?: string;
  }
): Promise<OCSShare> {
  const data = await apiFetch<OCSResponse<OCSShare>>(
    "/ocs/v2.php/apps/files_sharing/api/v1/shares?format=json",
    {
      method: "POST",
      basicAuth: opts.basicAuth,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return data.ocs.data;
}

export async function updateShare(
  opts: OCSOptions,
  shareId: string,
  payload: {
    permissions?: number;
    password?: string;
    expireDate?: string;
    note?: string;
    label?: string;
    hideDownload?: boolean;
  }
): Promise<OCSShare> {
  const data = await apiFetch<OCSResponse<OCSShare>>(
    `/ocs/v2.php/apps/files_sharing/api/v1/shares/${shareId}?format=json`,
    {
      method: "PUT",
      basicAuth: opts.basicAuth,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return data.ocs.data;
}

export async function deleteShare(
  opts: OCSOptions,
  shareId: string
): Promise<void> {
  await apiFetch(
    `/ocs/v2.php/apps/files_sharing/api/v1/shares/${shareId}?format=json`,
    { method: "DELETE", basicAuth: opts.basicAuth }
  );
}

export async function listPendingShares(opts: OCSOptions): Promise<OCSShare[]> {
  const data = await apiFetch<OCSResponse<OCSShare[]>>(
    "/ocs/v2.php/apps/files_sharing/api/v1/shares/pending?format=json",
    { basicAuth: opts.basicAuth }
  );
  return data.ocs.data;
}

export async function listDeletedShares(opts: OCSOptions): Promise<OCSShare[]> {
  const data = await apiFetch<OCSResponse<OCSShare[]>>(
    "/ocs/v2.php/apps/files_sharing/api/v1/deletedshares?format=json",
    { basicAuth: opts.basicAuth }
  );
  return data.ocs.data;
}

export async function undeleteShare(
  opts: OCSOptions,
  shareId: string
): Promise<void> {
  await apiFetch(
    `/ocs/v2.php/apps/files_sharing/api/v1/deletedshares/${shareId}?format=json`,
    { method: "POST", basicAuth: opts.basicAuth }
  );
}

export async function searchSharees(
  opts: OCSOptions,
  search: string,
  itemType = "file"
): Promise<OCSShareeResponse> {
  const query = new URLSearchParams({
    format: "json",
    search,
    itemType,
    lookup: "false",
  });
  const data = await apiFetch<OCSResponse<OCSShareeResponse>>(
    `/ocs/v2.php/apps/files_sharing/api/v1/sharees?${query}`,
    { basicAuth: opts.basicAuth }
  );
  return data.ocs.data;
}

// ── Activity ──────────────────────────────────────────────────────────────────

export async function listActivity(
  opts: OCSOptions,
  params?: {
    objectType?: string;
    objectId?: string;
    type?: string;
    since?: number;
    limit?: number;
    previews?: boolean;
  }
): Promise<OCSActivity[]> {
  const query = new URLSearchParams({ format: "json" });
  if (params?.objectType) query.set("object_type", params.objectType);
  if (params?.objectId) query.set("object_id", params.objectId);
  if (params?.type) query.set("type", params.type);
  if (params?.since) query.set("since", String(params.since));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.previews) query.set("previews", "true");

  const data = await apiFetch<OCSResponse<OCSActivity[]>>(
    `/ocs/v2.php/apps/activity/api/v2/activity?${query}`,
    { basicAuth: opts.basicAuth }
  );
  return data.ocs.data;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function listNotifications(
  opts: OCSOptions
): Promise<OCSNotification[]> {
  const data = await apiFetch<OCSResponse<OCSNotification[]>>(
    "/ocs/v2.php/apps/notifications/api/v2/notifications?format=json",
    { basicAuth: opts.basicAuth }
  );
  return data.ocs.data;
}

export async function dismissNotification(
  opts: OCSOptions,
  notificationId: number
): Promise<void> {
  await apiFetch(
    `/ocs/v2.php/apps/notifications/api/v2/notifications/${notificationId}?format=json`,
    { method: "DELETE", basicAuth: opts.basicAuth }
  );
}

// ── User Status (user_status app) ─────────────────────────────────────────────

const USER_STATUS_BASE = "/ocs/v2.php/apps/user_status/api/v1";

export async function getUserStatus(opts: OCSOptions): Promise<OCSUserStatus> {
  const data = await apiFetch<OCSResponse<OCSUserStatus>>(
    `${USER_STATUS_BASE}/user_status?format=json`,
    { basicAuth: opts.basicAuth }
  );
  return data.ocs.data;
}

export async function getPredefinedStatuses(
  opts: OCSOptions
): Promise<OCSPredefinedStatus[]> {
  // Route is declared with a trailing slash (`/api/v1/predefined_statuses/`).
  const data = await apiFetch<OCSResponse<OCSPredefinedStatus[]>>(
    `${USER_STATUS_BASE}/predefined_statuses/?format=json`,
    { basicAuth: opts.basicAuth }
  );
  return data.ocs.data;
}

export async function setUserStatusType(
  opts: OCSOptions,
  statusType: UserStatusType
): Promise<OCSUserStatus> {
  const data = await apiFetch<OCSResponse<OCSUserStatus>>(
    `${USER_STATUS_BASE}/user_status/status?format=json`,
    {
      method: "PUT",
      basicAuth: opts.basicAuth,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusType }),
    }
  );
  return data.ocs.data;
}

export async function setPredefinedStatusMessage(
  opts: OCSOptions,
  messageId: string,
  clearAt: number | null
): Promise<OCSUserStatus> {
  const data = await apiFetch<OCSResponse<OCSUserStatus>>(
    `${USER_STATUS_BASE}/user_status/message/predefined?format=json`,
    {
      method: "PUT",
      basicAuth: opts.basicAuth,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, clearAt }),
    }
  );
  return data.ocs.data;
}

export async function setCustomStatusMessage(
  opts: OCSOptions,
  payload: { statusIcon?: string | null; message?: string | null; clearAt: number | null }
): Promise<OCSUserStatus> {
  const data = await apiFetch<OCSResponse<OCSUserStatus>>(
    `${USER_STATUS_BASE}/user_status/message/custom?format=json`,
    {
      method: "PUT",
      basicAuth: opts.basicAuth,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return data.ocs.data;
}

export async function clearStatusMessage(opts: OCSOptions): Promise<void> {
  await apiFetch(`${USER_STATUS_BASE}/user_status/message?format=json`, {
    method: "DELETE",
    basicAuth: opts.basicAuth,
  });
}

// ── File reminders (files_reminders app) ──────────────────────────────────────

const REMINDERS_BASE = "/ocs/v2.php/apps/files_reminders/api/v1";

export async function getReminder(
  opts: OCSOptions,
  fileId: number
): Promise<string | null> {
  const data = await apiFetch<OCSResponse<{ dueDate: string | null }>>(
    `${REMINDERS_BASE}/${fileId}?format=json`,
    { basicAuth: opts.basicAuth }
  );
  return data.ocs.data.dueDate;
}

export async function setReminder(
  opts: OCSOptions,
  fileId: number,
  dueDate: string
): Promise<void> {
  await apiFetch(`${REMINDERS_BASE}/${fileId}?format=json`, {
    method: "PUT",
    basicAuth: opts.basicAuth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dueDate }),
  });
}

export async function removeReminder(
  opts: OCSOptions,
  fileId: number
): Promise<void> {
  await apiFetch(`${REMINDERS_BASE}/${fileId}?format=json`, {
    method: "DELETE",
    basicAuth: opts.basicAuth,
  });
}

// ── App config (provisioning_api — admin) ─────────────────────────────────────

const APPCONFIG_BASE = "/ocs/v2.php/apps/provisioning_api/api/v1/config/apps";

export async function getAppConfigKeys(
  opts: OCSOptions,
  app: string
): Promise<string[]> {
  const data = await apiFetch<OCSResponse<{ data: string[] }>>(
    `${APPCONFIG_BASE}/${encodeURIComponent(app)}?format=json`,
    { basicAuth: opts.basicAuth }
  );
  return data.ocs.data.data;
}

export async function getAppConfigValue(
  opts: OCSOptions,
  app: string,
  key: string,
  defaultValue = ""
): Promise<string> {
  const query = new URLSearchParams({ format: "json", defaultValue });
  const data = await apiFetch<OCSResponse<{ data: string }>>(
    `${APPCONFIG_BASE}/${encodeURIComponent(app)}/${encodeURIComponent(key)}?${query}`,
    { basicAuth: opts.basicAuth }
  );
  return data.ocs.data.data;
}

export async function setAppConfigValue(
  opts: OCSOptions,
  app: string,
  key: string,
  value: string
): Promise<void> {
  await apiFetch(
    `${APPCONFIG_BASE}/${encodeURIComponent(app)}/${encodeURIComponent(key)}?format=json`,
    {
      method: "POST",
      basicAuth: opts.basicAuth,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    }
  );
}

// ── Workflow engine (workflowengine app — admin global flows) ─────────────────

const WORKFLOW_BASE = "/ocs/v2.php/apps/workflowengine/api/v1/workflows/global";

export async function listGlobalWorkflows(
  opts: OCSOptions
): Promise<WorkflowOperation[]> {
  const data = await apiFetch<OCSResponse<WorkflowsByClass>>(
    `${WORKFLOW_BASE}?format=json`,
    { basicAuth: opts.basicAuth }
  );
  // Response is keyed by operation class; flatten into a single list.
  return Object.values(data.ocs.data ?? {}).flat();
}

export async function deleteGlobalWorkflow(
  opts: OCSOptions,
  id: number
): Promise<void> {
  await apiFetch(`${WORKFLOW_BASE}/${id}?format=json`, {
    method: "DELETE",
    basicAuth: opts.basicAuth,
  });
}

export async function createGlobalWorkflow(
  opts: OCSOptions,
  payload: CreateWorkflowPayload
): Promise<WorkflowOperation> {
  const data = await apiFetch<OCSResponse<WorkflowOperation>>(
    `${WORKFLOW_BASE}?format=json`,
    {
      method: "POST",
      basicAuth: opts.basicAuth,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return data.ocs.data;
}
