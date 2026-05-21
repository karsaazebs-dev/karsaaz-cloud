"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  listShares,
  createShare,
  updateShare,
  deleteShare,
  searchSharees,
  listPendingShares,
  listDeletedShares,
  undeleteShare,
} from "@/lib/api/ocs";
import type { OCSShare } from "@/lib/types/ocs.types";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

export function useShares(filePath: string | null) {
  const basicAuth = useAuth();
  return useQuery({
    queryKey: ["shares", filePath],
    queryFn: () => listShares({ basicAuth: basicAuth! }, { path: filePath! }),
    enabled: !!basicAuth && !!filePath,
    staleTime: 30_000,
  });
}

export function useCreateShare(filePath: string) {
  const basicAuth = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof createShare>[1]) =>
      createShare({ basicAuth: basicAuth! }, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shares", filePath] });
      toast.success("Share created");
    },
    onError: () => toast.error("Failed to create share"),
  });
}

export function useUpdateShare(filePath: string) {
  const basicAuth = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shareId, ...payload }: { shareId: string } & Parameters<typeof updateShare>[2]) =>
      updateShare({ basicAuth: basicAuth! }, shareId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shares", filePath] });
      toast.success("Share updated");
    },
    onError: () => toast.error("Failed to update share"),
  });
}

export function useDeleteShare(filePath: string) {
  const basicAuth = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) =>
      deleteShare({ basicAuth: basicAuth! }, shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shares", filePath] });
      toast.success("Share removed");
    },
    onError: () => toast.error("Failed to remove share"),
  });
}

/** Shares the current user created (shared with others). */
export function useSharesByMe() {
  const basicAuth = useAuth();
  return useQuery({
    queryKey: ["shares-by-me"],
    queryFn: () => listShares({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 30_000,
  });
}

export function usePendingShares() {
  const basicAuth = useAuth();
  return useQuery({
    queryKey: ["shares-pending"],
    queryFn: () => listPendingShares({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 30_000,
  });
}

export function useDeletedShares() {
  const basicAuth = useAuth();
  return useQuery({
    queryKey: ["shares-deleted"],
    queryFn: () => listDeletedShares({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 30_000,
  });
}

export function useUndeleteShare() {
  const basicAuth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shareId: string) => undeleteShare({ basicAuth: basicAuth! }, shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shares-deleted"] });
      toast.success("Share restored");
    },
    onError: () => toast.error("Failed to restore share"),
  });
}

export function useSearchSharees(search: string) {
  const basicAuth = useAuth();
  return useQuery({
    queryKey: ["sharees", search],
    queryFn: () => searchSharees({ basicAuth: basicAuth! }, search),
    enabled: !!basicAuth && search.length >= 1,
    staleTime: 10_000,
  });
}

// Share type constants
export const SHARE_TYPE_USER = 0;
export const SHARE_TYPE_GROUP = 1;
export const SHARE_TYPE_LINK = 3;
export const SHARE_TYPE_EMAIL = 4;

// Permission bitmask constants
export const PERM_READ = 1;
export const PERM_UPDATE = 2;
export const PERM_CREATE = 4;
export const PERM_DELETE = 8;
export const PERM_SHARE = 16;
export const PERM_ALL = 31;

export function permissionsLabel(permissions: number): string {
  if (permissions === PERM_READ) return "View only";
  if ((permissions & (PERM_READ | PERM_UPDATE)) === (PERM_READ | PERM_UPDATE)) return "Can edit";
  if (permissions === PERM_ALL) return "Full access";
  return `Custom (${permissions})`;
}
