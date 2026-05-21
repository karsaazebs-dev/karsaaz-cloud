"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getReminder, setReminder, removeReminder } from "@/lib/api/ocs";
import { listComments, createComment, deleteComment } from "@/lib/api/comments";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

// ── Reminders ─────────────────────────────────────────────────────────────────

export function useReminder(fileId: number | null) {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: ["reminder", fileId],
    queryFn: () => getReminder({ basicAuth: basicAuth! }, fileId!),
    enabled: !!basicAuth && !!fileId,
    staleTime: 30_000,
  });
}

export function useSetReminder(fileId: number) {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dueDate: string) =>
      setReminder({ basicAuth: basicAuth! }, fileId, dueDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminder", fileId] });
      toast.success("Reminder set");
    },
    onError: () => toast.error("Could not set reminder"),
  });
}

export function useRemoveReminder(fileId: number) {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => removeReminder({ basicAuth: basicAuth! }, fileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminder", fileId] });
      toast.success("Reminder cleared");
    },
    onError: () => toast.error("Could not clear reminder"),
  });
}

/** "Remind me later" presets, each resolving to an ISO 8601 string. */
export const REMINDER_PRESETS: { label: string; iso: () => string }[] = [
  {
    label: "Later today",
    iso: () => {
      const d = new Date();
      d.setHours(d.getHours() + 3, 0, 0, 0);
      return d.toISOString();
    },
  },
  {
    label: "Tomorrow",
    iso: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d.toISOString();
    },
  },
  {
    label: "This weekend",
    iso: () => {
      const d = new Date();
      d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
      d.setHours(9, 0, 0, 0);
      return d.toISOString();
    },
  },
  {
    label: "Next week",
    iso: () => {
      const d = new Date();
      d.setDate(d.getDate() + ((1 - d.getDay() + 7) % 7 || 7));
      d.setHours(9, 0, 0, 0);
      return d.toISOString();
    },
  },
];

// ── Comments ──────────────────────────────────────────────────────────────────

export function useComments(fileId: number | null) {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: ["comments", fileId],
    queryFn: () => listComments(fileId!, { basicAuth: basicAuth! }),
    enabled: !!basicAuth && !!fileId,
    staleTime: 15_000,
  });
}

export function useAddComment(fileId: number) {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) =>
      createComment(fileId, message, { basicAuth: basicAuth! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", fileId] }),
    onError: () => toast.error("Could not post comment"),
  });
}

export function useDeleteComment(fileId: number) {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      deleteComment(fileId, commentId, { basicAuth: basicAuth! }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", fileId] });
      toast.success("Comment deleted");
    },
    onError: () => toast.error("Could not delete comment"),
  });
}
