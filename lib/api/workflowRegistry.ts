// Workflow engine plugin registry — operations, entities and checks available
// on the server. Delivered as initial state on the admin workflow page
// (`workflowengine-{operators,entities,checks,scope}`), so we fetch and decode
// that page. This mirrors how the Vue UI loads the registry.

import type {
  WorkflowRegistry,
  WorkflowOperator,
  WorkflowEntity,
  WorkflowCheckDef,
} from "@/lib/types/ocs.types";

const WORKFLOW_ADMIN_PAGE = "/api/proxy/index.php/settings/admin/workflow";

interface AuthOptions {
  basicAuth: string;
}

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

export async function getWorkflowRegistry(
  opts: AuthOptions
): Promise<WorkflowRegistry> {
  const res = await fetch(WORKFLOW_ADMIN_PAGE, {
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
    scope: decodeState<number>(doc, "scope", 0),
  };
}
