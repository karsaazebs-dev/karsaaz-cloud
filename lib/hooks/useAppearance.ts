"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getThemes, enableTheme, disableTheme } from "@/lib/api/appearance";
import type { Theme } from "@/lib/api/appearance";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

const THEMES_KEY = ["appearance-themes"] as const;

export function useThemes() {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: THEMES_KEY,
    queryFn: () => getThemes({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 60_000,
  });
}

export function useEnableTheme() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (themeId: string) =>
      enableTheme({ basicAuth: basicAuth! }, themeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: THEMES_KEY });
      toast.success("Appearance updated");
    },
    onError: () => toast.error("Could not update appearance"),
  });
}

export function useDisableTheme() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (themeId: string) =>
      disableTheme({ basicAuth: basicAuth! }, themeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: THEMES_KEY });
      toast.success("Appearance updated");
    },
    onError: () => toast.error("Could not update appearance"),
  });
}

export type { Theme };
