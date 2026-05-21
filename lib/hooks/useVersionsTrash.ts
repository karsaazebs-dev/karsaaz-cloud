"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getVersions,
  getTrashItems,
  restoreItem,
  deleteTrashItem,
  emptyTrash,
  listFavorites,
} from "@/lib/api/webdav";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

export function useFileVersions(fileId: number | null) {
  const basicAuth = useAuth();
  return useQuery({
    queryKey: ["versions", fileId],
    queryFn: () => getVersions(fileId!, { basicAuth: basicAuth! }),
    enabled: !!basicAuth && fileId != null,
    staleTime: 60_000,
  });
}

export function useTrash() {
  const basicAuth = useAuth();
  return useQuery({
    queryKey: ["trash"],
    queryFn: () => getTrashItems({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 30_000,
  });
}

export function useRestoreTrash() {
  const basicAuth = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ href, filename }: { href: string; filename: string }) =>
      restoreItem(href, filename, { basicAuth: basicAuth! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("File restored");
    },
    onError: () => toast.error("Failed to restore file"),
  });
}

export function useDeleteTrashItem() {
  const basicAuth = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (href: string) =>
      deleteTrashItem(href, { basicAuth: basicAuth! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      toast.success("Permanently deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });
}

export function useEmptyTrash() {
  const basicAuth = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => emptyTrash({ basicAuth: basicAuth! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      toast.success("Trash emptied");
    },
    onError: () => toast.error("Failed to empty trash"),
  });
}

export function useFavorites() {
  const basicAuth = useAuth();
  return useQuery({
    queryKey: ["favorites"],
    queryFn: () => listFavorites({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 30_000,
  });
}
