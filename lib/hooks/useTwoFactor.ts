"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getBackupCodesState,
  createBackupCodes,
  type CreatedBackupCodes,
} from "@/lib/api/twoFactor";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

const KEY = ["backup-codes-state"] as const;

export function useBackupCodesState() {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: KEY,
    queryFn: () => getBackupCodesState({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 60_000,
  });
}

export function useCreateBackupCodes() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation<CreatedBackupCodes, Error, void>({
    mutationFn: () => createBackupCodes({ basicAuth: basicAuth! }),
    onSuccess: (data) => {
      qc.setQueryData(KEY, data.state);
      toast.success("New backup codes generated");
    },
    onError: () => toast.error("Could not generate backup codes"),
  });
}
