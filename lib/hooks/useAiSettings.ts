"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getAiSettings,
  saveAiSettings,
  type AiSettings,
  type AiSettingsMap,
} from "@/lib/api/aiSettings";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

const KEY = ["ai-settings"] as const;

export function useAiSettings() {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: KEY,
    queryFn: () => getAiSettings({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 60_000,
  });
}

/**
 * Persist a change to one or more provider-preference keys.
 *
 * The backend stores each preference key wholesale, so we merge the partial
 * change into the current settings map before sending it, and update the cache.
 */
export function useSaveAiSettings() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (change: Partial<AiSettingsMap>) =>
      saveAiSettings({ basicAuth: basicAuth! }, change),
    onMutate: (change) => {
      const previous = qc.getQueryData<AiSettings>(KEY);
      if (previous) {
        qc.setQueryData<AiSettings>(KEY, {
          ...previous,
          settings: { ...previous.settings, ...change },
        });
      }
      return { previous };
    },
    onError: (_err, _change, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
      toast.error("Could not save AI setting");
    },
    onSuccess: () => toast.success("Saved"),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
