"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/useAuth";
import { getServerInfo } from "@/lib/api/serverInfo";

const KEY = ["server-info"] as const;

export function useServerInfo() {
  const { basicAuth } = useAuth();
  return useQuery({
    queryKey: KEY,
    queryFn: () => getServerInfo({ basicAuth }),
    enabled: !!basicAuth,
    // Live stats (CPU, memory, active users) — poll frequently.
    refetchInterval: 10_000,
    retry: false,
  });
}
