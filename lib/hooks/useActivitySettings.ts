"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getActivitySettings,
  saveActivitySettings,
  PERSONAL_NOTIFICATIONS_PAGE,
  PERSONAL_SAVE_PATH,
  type ActivityGroup,
} from "@/lib/api/activitySettings";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

const KEY = ["activity-settings"] as const;

export function useActivitySettings() {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: KEY,
    queryFn: () => getActivitySettings({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 60_000,
  });
}

/**
 * Saves the full set of per-type defaults. The backend resets any omitted flag
 * to false, so the caller passes the entire current group state.
 */
export function useSaveActivitySettings() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groups: ActivityGroup[]) =>
      saveActivitySettings({ basicAuth: basicAuth! }, groups),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Saved");
    },
    onError: () => toast.error("Could not save activity settings"),
  });
}

// ── Personal notification preferences (user-scoped activity settings) ─────────

const PERSONAL_KEY = ["notification-settings"] as const;

export function useNotificationSettings() {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: PERSONAL_KEY,
    queryFn: () =>
      getActivitySettings({ basicAuth: basicAuth! }, PERSONAL_NOTIFICATIONS_PAGE),
    enabled: !!basicAuth,
    staleTime: 60_000,
    retry: false,
  });
}

export function useSaveNotificationSettings() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groups: ActivityGroup[]) =>
      saveActivitySettings({ basicAuth: basicAuth! }, groups, PERSONAL_SAVE_PATH),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PERSONAL_KEY });
      toast.success("Notification preferences saved");
    },
    onError: () => toast.error("Could not save notification preferences"),
  });
}
