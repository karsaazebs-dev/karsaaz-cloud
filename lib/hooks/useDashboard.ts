"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getCurrentUser,
  listActivity,
  listShares,
  getWeatherLocation,
  getWeatherForecast,
  setWeatherLocation,
  useWeatherPersonalAddress,
} from "@/lib/api/ocs";
import { listFiles, listFilesDeep } from "@/lib/api/webdav";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type SessionData = { basicAuth?: string; username?: string } & Record<string, unknown>;

function useAuth() {
  const { data: session } = useSession();
  const s = session as SessionData | null;
  return {
    basicAuth: s?.basicAuth as string | undefined,
    username: s?.username as string | undefined,
  };
}

export function useCurrentUser() {
  const { basicAuth } = useAuth();
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => getCurrentUser({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 5 * 60_000,
  });
}

export function useQuota() {
  const { basicAuth } = useAuth();
  return useQuery({
    queryKey: ["quota"],
    queryFn: async () => {
      const user = await getCurrentUser({ basicAuth: basicAuth! });
      return user.quota;
    },
    enabled: !!basicAuth,
    staleTime: 60_000,
  });
}

export function useRecentFiles(limit = 10) {
  const { basicAuth, username } = useAuth();
  return useQuery({
    queryKey: ["recentFiles", username, limit],
    queryFn: async () => {
      const davPath = `/remote.php/dav/files/${username}/`;
      const files = await listFiles(davPath, { basicAuth: basicAuth! });
      return files
        .filter((f) => f.type === "file")
        .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
        .slice(0, limit);
    },
    enabled: !!basicAuth && !!username,
    staleTime: 60_000,
  });
}

export function useActivityFeed(limit = 20) {
  const { basicAuth } = useAuth();
  return useQuery({
    queryKey: ["activity", limit],
    queryFn: () =>
      listActivity({ basicAuth: basicAuth! }, { limit }),
    enabled: !!basicAuth,
    staleTime: 30_000,
  });
}

export function useSharedWithMe() {
  const { basicAuth } = useAuth();
  return useQuery({
    queryKey: ["sharedWithMe"],
    queryFn: () =>
      listShares({ basicAuth: basicAuth! }, { shared_with_me: true }),
    enabled: !!basicAuth,
    staleTime: 60_000,
  });
}

export function useAllFilesDeep() {
  const { basicAuth, username } = useAuth();
  return useQuery({
    queryKey: ["allFilesDeep", username],
    queryFn: async () => {
      const davPath = `/remote.php/dav/files/${username}/`;
      return await listFilesDeep(davPath, { basicAuth: basicAuth! });
    },
    enabled: !!basicAuth && !!username,
    staleTime: 5 * 60_000,
  });
}

// ── Weather ─────────────────────────────────────────────────────────────────

export function useWeatherLocation() {
  const { basicAuth } = useAuth();
  return useQuery({
    queryKey: ["weather-location"],
    queryFn: () => getWeatherLocation({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 5 * 60_000,
  });
}

export function useWeatherForecast() {
  const { basicAuth } = useAuth();
  return useQuery({
    queryKey: ["weather-forecast"],
    queryFn: () => getWeatherForecast({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 30 * 60_000,
    retry: false,
  });
}

export function useSetWeatherLocation() {
  const { basicAuth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { address?: string; lat?: number; lon?: number }) =>
      setWeatherLocation({ basicAuth: basicAuth! }, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weather-location"] });
      qc.invalidateQueries({ queryKey: ["weather-forecast"] });
      toast.success("Location updated");
    },
    onError: () => toast.error("Could not set location"),
  });
}

export function useWeatherUsePersonalAddress() {
  const { basicAuth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => useWeatherPersonalAddress({ basicAuth: basicAuth! }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weather-location"] });
      qc.invalidateQueries({ queryKey: ["weather-forecast"] });
    },
    onError: () => toast.error("No personal address configured"),
  });
}

// Widget layout persistence — stored in localStorage for now
export type WidgetId =
  | "chartFileType"
  | "chartMonthlyUploads"
  | "chartActivityTrends"
  | "chartStorage";

export interface WidgetLayout {
  id: WidgetId;
  label: string;
  enabled: boolean;
  order: number;
}

const DEFAULT_WIDGETS: WidgetLayout[] = [
  { id: "chartFileType", label: "File Type Distribution", enabled: true, order: 0 },
  { id: "chartMonthlyUploads", label: "Monthly Uploads", enabled: true, order: 1 },
  { id: "chartActivityTrends", label: "Activity Trends", enabled: true, order: 2 },
  { id: "chartStorage", label: "Storage Usage", enabled: true, order: 3 },
];

const STORAGE_KEY = "karsaaz-dashboard-layout";

export function loadWidgetLayout(): WidgetLayout[] {
  if (typeof window === "undefined") return DEFAULT_WIDGETS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const validIds = new Set<WidgetId>([
        "chartFileType",
        "chartMonthlyUploads",
        "chartActivityTrends",
        "chartStorage",
      ]);
      const parsed = (JSON.parse(saved) as WidgetLayout[]).filter((w) => validIds.has(w.id));
      const seen = new Set(parsed.map((w) => w.id));
      // Append any widgets added since the layout was saved so new features surface.
      const merged = [...parsed];
      for (const def of DEFAULT_WIDGETS) {
        if (!seen.has(def.id)) merged.push({ ...def, order: merged.length });
      }
      return merged.map((w, index) => ({ ...w, order: index }));
    }
  } catch {
    // ignore
  }
  return DEFAULT_WIDGETS;
}

export function saveWidgetLayout(layout: WidgetLayout[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // ignore
  }
}
