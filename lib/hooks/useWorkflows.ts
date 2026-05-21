"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  listGlobalWorkflows,
  deleteGlobalWorkflow,
  createGlobalWorkflow,
} from "@/lib/api/ocs";
import { getWorkflowRegistry } from "@/lib/api/workflowRegistry";
import type { CreateWorkflowPayload } from "@/lib/types/ocs.types";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

const KEY = ["workflows", "global"] as const;

export function useGlobalWorkflows() {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: KEY,
    queryFn: () => listGlobalWorkflows({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 60_000,
  });
}

export function useDeleteWorkflow() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteGlobalWorkflow({ basicAuth: basicAuth! }, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Workflow removed");
    },
    onError: () => toast.error("Could not remove workflow"),
  });
}

export function useWorkflowRegistry() {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: ["workflow-registry"],
    queryFn: () => getWorkflowRegistry({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 5 * 60_000,
  });
}

export function useCreateWorkflow() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWorkflowPayload) =>
      createGlobalWorkflow({ basicAuth: basicAuth! }, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Flow created");
    },
    onError: (e: Error) => toast.error(e.message || "Could not create flow"),
  });
}

/** Human-friendly label for a fully-qualified operation/entity class name. */
export function shortClassName(fqcn: string): string {
  const parts = fqcn.split("\\");
  return parts[parts.length - 1] || fqcn;
}

/**
 * Comparison operators for the core shipped checks. These ship with
 * workflowengine itself (not third-party apps), so their operators are stable.
 * Unknown/third-party checks fall back to a free-text operator field.
 */
export const CORE_CHECK_OPERATORS: Record<string, { value: string; label: string }[]> = {
  "OCA\\WorkflowEngine\\Check\\FileMimeType": [
    { value: "is", label: "is" },
    { value: "!is", label: "is not" },
    { value: "matches", label: "matches (regex)" },
    { value: "!matches", label: "does not match (regex)" },
  ],
  "OCA\\WorkflowEngine\\Check\\FileName": [
    { value: "is", label: "is" },
    { value: "!is", label: "is not" },
    { value: "matches", label: "matches (regex)" },
    { value: "!matches", label: "does not match (regex)" },
  ],
  "OCA\\WorkflowEngine\\Check\\FileSize": [
    { value: "less", label: "less than" },
    { value: "!greater", label: "less or equal" },
    { value: "greater", label: "greater than" },
    { value: "!less", label: "greater or equal" },
  ],
  "OCA\\WorkflowEngine\\Check\\FileSystemTags": [
    { value: "is", label: "is tagged" },
    { value: "!is", label: "is not tagged" },
  ],
  "OCA\\WorkflowEngine\\Check\\RequestRemoteAddress": [
    { value: "matchesIPv4", label: "matches IPv4" },
    { value: "!matchesIPv4", label: "does not match IPv4" },
    { value: "matchesIPv6", label: "matches IPv6" },
    { value: "!matchesIPv6", label: "does not match IPv6" },
  ],
  "OCA\\WorkflowEngine\\Check\\RequestTime": [
    { value: "in", label: "between" },
    { value: "!in", label: "not between" },
  ],
  "OCA\\WorkflowEngine\\Check\\RequestUserAgent": [
    { value: "is", label: "is" },
    { value: "!is", label: "is not" },
    { value: "matches", label: "matches (regex)" },
    { value: "!matches", label: "does not match (regex)" },
  ],
  "OCA\\WorkflowEngine\\Check\\UserGroupMembership": [
    { value: "is", label: "is member of" },
    { value: "!is", label: "is not member of" },
  ],
};
