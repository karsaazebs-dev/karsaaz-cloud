"use client";

import { useState, useCallback, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listActivity, listNotifications, dismissNotification } from "@/lib/api/ocs";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useAuth() {
  const { data: session } = useSession();
  const s = session as SessionData | null;
  return { basicAuth: s?.basicAuth as string | undefined };
}

const ACTIVITY_TYPES = [
  { value: "all", label: "All" },
  { value: "files", label: "Files" },
  { value: "file_created", label: "Created" },
  { value: "file_changed", label: "Changed" },
  { value: "file_deleted", label: "Deleted" },
  { value: "shared", label: "Shared" },
];

export function useActivityPage(type: string) {
  const { basicAuth } = useAuth();
  return useInfiniteQuery({
    queryKey: ["activityInfinite", type],
    queryFn: async ({ pageParam = undefined }) => {
      const params: Record<string, string | number | boolean> = { limit: 30 };
      if (type !== "all") params.type = type;
      if (pageParam) params.since = pageParam as number;
      return listActivity({ basicAuth: basicAuth! }, params as Parameters<typeof listActivity>[1]);
    },
    getNextPageParam: (lastPage) =>
      lastPage.length === 30 ? lastPage[lastPage.length - 1].activity_id : undefined,
    initialPageParam: undefined as number | undefined,
    enabled: !!basicAuth,
  });
}

export function useNotifications() {
  const { basicAuth } = useAuth();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: false,
  });
}

export function useDismissNotification() {
  const { basicAuth } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => dismissNotification({ basicAuth: basicAuth! }, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export { ACTIVITY_TYPES };
