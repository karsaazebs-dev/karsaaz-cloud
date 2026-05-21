"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getUserStatus,
  getPredefinedStatuses,
  setUserStatusType,
  setPredefinedStatusMessage,
  setCustomStatusMessage,
  clearStatusMessage,
} from "@/lib/api/ocs";
import type {
  OCSUserStatus,
  OCSPredefinedStatus,
  UserStatusType,
} from "@/lib/types/ocs.types";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

const STATUS_KEY = ["user-status"] as const;

export function useUserStatus() {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: STATUS_KEY,
    queryFn: () => getUserStatus({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 60_000,
  });
}

export function usePredefinedStatuses() {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: ["predefined-statuses"],
    queryFn: () => getPredefinedStatuses({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: Infinity,
  });
}

export function useSetStatusType() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (statusType: UserStatusType) =>
      setUserStatusType({ basicAuth: basicAuth! }, statusType),
    onSuccess: (data) => qc.setQueryData(STATUS_KEY, data),
    onError: () => toast.error("Could not update status"),
  });
}

export function useSetPredefinedMessage() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ status, clearAt }: { status: OCSPredefinedStatus; clearAt: number | null }) =>
      setPredefinedStatusMessage({ basicAuth: basicAuth! }, status.id, clearAt),
    onSuccess: (data) => {
      qc.setQueryData(STATUS_KEY, data);
      toast.success("Status updated");
    },
    onError: () => toast.error("Could not set status message"),
  });
}

export function useSetCustomMessage() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { statusIcon?: string | null; message?: string | null; clearAt: number | null }) =>
      setCustomStatusMessage({ basicAuth: basicAuth! }, payload),
    onSuccess: (data) => {
      qc.setQueryData(STATUS_KEY, data);
      toast.success("Status updated");
    },
    onError: () => toast.error("Could not set status message"),
  });
}

export function useClearMessage() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clearStatusMessage({ basicAuth: basicAuth! }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STATUS_KEY });
      toast.success("Status cleared");
    },
    onError: () => toast.error("Could not clear status"),
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve a predefined status's clearAt descriptor into a unix timestamp (seconds). */
export function resolveClearAt(
  clearAt: OCSPredefinedStatus["clearAt"]
): number | null {
  if (!clearAt) return null;
  const now = Math.floor(Date.now() / 1000);
  if (clearAt.type === "period") {
    return now + Number(clearAt.time);
  }
  // "end-of": time is "day" or "week"
  const d = new Date();
  if (clearAt.time === "day") {
    d.setHours(23, 59, 59, 0);
  } else if (clearAt.time === "week") {
    const day = d.getDay(); // 0 = Sunday
    const daysUntilSunday = (7 - day) % 7;
    d.setDate(d.getDate() + daysUntilSunday);
    d.setHours(23, 59, 59, 0);
  }
  return Math.floor(d.getTime() / 1000);
}

/** Predefined "clear after" choices offered for custom statuses. */
export const CLEAR_AT_OPTIONS: { label: string; value: () => number | null }[] = [
  { label: "Don't clear", value: () => null },
  { label: "30 minutes", value: () => Math.floor(Date.now() / 1000) + 30 * 60 },
  { label: "1 hour", value: () => Math.floor(Date.now() / 1000) + 60 * 60 },
  { label: "4 hours", value: () => Math.floor(Date.now() / 1000) + 4 * 60 * 60 },
  {
    label: "Today",
    value: () => {
      const d = new Date();
      d.setHours(23, 59, 59, 0);
      return Math.floor(d.getTime() / 1000);
    },
  },
  {
    label: "This week",
    value: () => {
      const d = new Date();
      const daysUntilSunday = (7 - d.getDay()) % 7;
      d.setDate(d.getDate() + daysUntilSunday);
      d.setHours(23, 59, 59, 0);
      return Math.floor(d.getTime() / 1000);
    },
  },
];

export const STATUS_META: Record<
  UserStatusType,
  { label: string; dotClass: string }
> = {
  online: { label: "Online", dotClass: "bg-green-500" },
  away: { label: "Away", dotClass: "bg-yellow-400" },
  dnd: { label: "Do not disturb", dotClass: "bg-red-500" },
  invisible: { label: "Invisible", dotClass: "bg-transparent border border-muted-foreground" },
  offline: { label: "Offline", dotClass: "bg-muted-foreground/40" },
};

export type { OCSUserStatus };
