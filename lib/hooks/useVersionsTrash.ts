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
import type { KarsaazFile } from "@/lib/types/file.types";
import { normalizePath } from "@/lib/utils/files";

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
  return useQuery<KarsaazFile[]>({
    queryKey: ["favorites"],
    queryFn: async () => {
      if (basicAuth) {
        try {
          const serverFavs = await listFavorites({ basicAuth });
          if (typeof window !== "undefined" && Array.isArray(serverFavs)) {
            const favsMap: Record<string, KarsaazFile> = {};
            for (const f of serverFavs) {
              const normPath = normalizePath(f.path);
              favsMap[normPath] = { ...f, path: normPath, isFavorite: true };
            }
            localStorage.setItem("karsaaz-favorites", JSON.stringify(favsMap));
            return Object.values(favsMap);
          }
        } catch (err) {
          console.error("Failed to fetch favorites from server, falling back to localStorage:", err);
        }
      }

      if (typeof window === "undefined") return [];
      try {
        const saved = localStorage.getItem("karsaaz-favorites");
        if (saved) {
          const favsMap = JSON.parse(saved);
          return Object.values(favsMap) as KarsaazFile[];
        }
      } catch (e) {}
      return [];
    },
    enabled: !!basicAuth,
    staleTime: 5_000,
  });
}
