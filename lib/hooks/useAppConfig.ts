"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getAppConfigValue, setAppConfigValue } from "@/lib/api/ocs";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

/** Read a set of app-config keys for one app into a { key: value } record. */
export function useAppConfigValues(app: string, keys: string[]) {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: ["appconfig", app, keys],
    queryFn: async () => {
      const entries = await Promise.all(
        keys.map(async (key) => {
          try {
            const value = await getAppConfigValue({ basicAuth: basicAuth! }, app, key);
            return [key, value] as const;
          } catch {
            return [key, ""] as const;
          }
        })
      );
      return Object.fromEntries(entries) as Record<string, string>;
    },
    enabled: !!basicAuth && keys.length > 0,
    staleTime: 60_000,
  });
}

export function useSetAppConfigValue(app: string) {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      setAppConfigValue({ basicAuth: basicAuth! }, app, key, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appconfig", app] });
    },
    onError: () => toast.error("Could not save setting"),
  });
}
