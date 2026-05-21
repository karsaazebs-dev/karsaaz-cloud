// Workflow engine — PERSONAL (user-scope) flows.
//
// Mirrors the admin/global workflow API (lib/api/ocs.ts + lib/api/workflowRegistry.ts)
// but targets the `user` resource instead of `global`:
//   - list/create/delete via OCS base `…/api/v1/workflows/user`
//   - registry initial-state from the page `/index.php/settings/user/workflow`
//     (same `workflowengine-{operators,entities,checks,scope}` keys; scope = 1 = user).

import { apiFetch } from "./client";
import type {
  OCSResponse,
  WorkflowOperation,
  WorkflowsByClass,
  CreateWorkflowPayload,
  WorkflowRegistry,
  WorkflowOperator,
  WorkflowEntity,
  WorkflowCheckDef,
} from "@/lib/types/ocs.types";

interface AuthOptions {
  basicAuth: string;
}

// ── OCS user-scope workflow CRUD ───────────────────────────────────────────────

const USER_WORKFLOW_BASE =
  "/ocs/v2.php/apps/workflowengine/api/v1/workflows/user";

export async function listUserWorkflows(
  opts: AuthOptions
): Promise<WorkflowOperation[]> {
  const data = await apiFetch<OCSResponse<WorkflowsByClass>>(
    `${USER_WORKFLOW_BASE}?format=json`,
    { basicAuth: opts.basicAuth }
  );
  // Response is keyed by operation class; flatten into a single list.
  return Object.values(data.ocs.data ?? {}).flat();
}

export async function deleteUserWorkflow(
  opts: AuthOptions,
  id: number
): Promise<void> {
  await apiFetch(`${USER_WORKFLOW_BASE}/${id}?format=json`, {
    method: "DELETE",
    basicAuth: opts.basicAuth,
  });
}

export async function createUserWorkflow(
  opts: AuthOptions,
  payload: CreateWorkflowPayload
): Promise<WorkflowOperation> {
  const data = await apiFetch<OCSResponse<WorkflowOperation>>(
    `${USER_WORKFLOW_BASE}?format=json`,
    {
      method: "POST",
      basicAuth: opts.basicAuth,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return data.ocs.data;
}

// ── Registry (decode initial state from the user workflow page) ────────────────

const WORKFLOW_USER_PAGE = "/api/proxy/index.php/settings/user/workflow";

function decodeState<T>(doc: Document, key: string, fallback: T): T {
  const el = doc.getElementById(`initial-state-workflowengine-${key}`);
  const b64 = el?.getAttribute("value");
  if (!b64) return fallback;
  try {
    return JSON.parse(atob(b64)) as T;
  } catch {
    return fallback;
  }
}

export async function getUserWorkflowRegistry(
  opts: AuthOptions
): Promise<WorkflowRegistry> {
  const res = await fetch(WORKFLOW_USER_PAGE, {
    headers: { Authorization: `Basic ${opts.basicAuth}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to load workflow registry (${res.status})`);
  }
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  return {
    operators: decodeState<WorkflowOperator[]>(doc, "operators", []),
    entities: decodeState<WorkflowEntity[]>(doc, "entities", []),
    checks: decodeState<WorkflowCheckDef[]>(doc, "checks", []),
    scope: decodeState<number>(doc, "scope", 1),
  };
}
