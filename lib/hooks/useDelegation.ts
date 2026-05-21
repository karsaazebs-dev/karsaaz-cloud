"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getDelegationData, saveAuthorizedGroups } from "@/lib/api/delegation";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

const KEY = ["delegation"] as const;

export function useDelegationData() {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: KEY,
    queryFn: () => getDelegationData({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 60_000,
  });
}

export function useSaveAuthorizedGroups() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ className, gids }: { className: string; gids: string[] }) =>
      saveAuthorizedGroups({ basicAuth: basicAuth! }, className, gids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Delegation updated");
    },
    onError: () => toast.error("Could not update delegation"),
  });
}
