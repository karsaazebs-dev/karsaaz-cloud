"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { fetchSecurityPageState } from "@/lib/api/initialState";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

/**
 * Read a single `initial-state-{id}` entry (base64 JSON) from a rendered admin
 * settings page. Used by the thin admin sections (AppAPI, Notifications) that
 * have no dedicated JSON API and only expose data via server-injected state.
 *
 * Queries are non-retrying: a missing key resolves to `null`, and a 403/404 on
 * the page should surface immediately rather than spinning.
 */
export function useSettingsPageState<T>(id: string, page: string) {
  const basicAuth = useBasicAuth();
  return useQuery<T | null>({
    queryKey: ["settings-page-state", page, id],
    queryFn: () => fetchSecurityPageState<T>(id, basicAuth!, page),
    enabled: !!basicAuth,
    retry: false,
    staleTime: 60_000,
  });
}
