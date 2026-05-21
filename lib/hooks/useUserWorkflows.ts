"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  listUserWorkflows,
  deleteUserWorkflow,
  createUserWorkflow,
  getUserWorkflowRegistry,
} from "@/lib/api/userWorkflow";
import type { CreateWorkflowPayload } from "@/lib/types/ocs.types";
import { toast } from "sonner";

// Shared helpers/constants are identical for user- and global-scope flows.
export { shortClassName, CORE_CHECK_OPERATORS } from "@/lib/hooks/useWorkflows";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

const KEY = ["workflows", "user"] as const;

export function useUserWorkflows() {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: KEY,
    queryFn: () => listUserWorkflows({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 60_000,
  });
}

export function useDeleteUserWorkflow() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      deleteUserWorkflow({ basicAuth: basicAuth! }, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Flow removed");
    },
    onError: () => toast.error("Could not remove flow"),
  });
}

export function useUserWorkflowRegistry() {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: ["workflow-registry", "user"],
    queryFn: () => getUserWorkflowRegistry({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 5 * 60_000,
  });
}

export function useCreateUserWorkflow() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWorkflowPayload) =>
      createUserWorkflow({ basicAuth: basicAuth! }, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Flow created");
    },
    onError: (e: Error) => toast.error(e.message || "Could not create flow"),
  });
}
