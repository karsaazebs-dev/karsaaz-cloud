"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getPersonalSharingSettings,
  setDefaultAccept,
  setShareFolder,
  resetShareFolder,
} from "@/lib/api/personalSharing";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

const KEY = ["personal-sharing"] as const;

export function usePersonalSharingSettings() {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: KEY,
    queryFn: () => getPersonalSharingSettings({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 60_000,
  });
}

export function useSetDefaultAccept() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accept: boolean) => setDefaultAccept({ basicAuth: basicAuth! }, accept),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Saved");
    },
    onError: () => toast.error("Could not save setting"),
  });
}

export function useSetShareFolder() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shareFolder: string) => setShareFolder({ basicAuth: basicAuth! }, shareFolder),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Share folder updated");
    },
    onError: () => toast.error("Could not update share folder"),
  });
}

export function useResetShareFolder() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => resetShareFolder({ basicAuth: basicAuth! }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Reset to default");
    },
    onError: () => toast.error("Could not reset"),
  });
}
