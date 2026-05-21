"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { listFiles, createFolder, deleteFile, moveFile, copyFile, toggleFavorite } from "@/lib/api/webdav";
import type { KarsaazFile } from "@/lib/types/file.types";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

export function useFiles(path: string) {
  const { data: session } = useSession();
  const basicAuth = (session as SessionData | null)?.basicAuth as string | undefined;

  return useQuery({
    queryKey: ["files", path],
    queryFn: () => listFiles(path, { basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 15_000,
  });
}

export function useCreateFolder(currentPath: string) {
  const { data: session } = useSession();
  const basicAuth = (session as SessionData | null)?.basicAuth as string | undefined;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) =>
      createFolder(`${currentPath}/${name}`, { basicAuth: basicAuth! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", currentPath] });
      toast.success("Folder created");
    },
    onError: () => toast.error("Failed to create folder"),
  });
}

export function useDeleteFile(currentPath: string) {
  const { data: session } = useSession();
  const basicAuth = (session as SessionData | null)?.basicAuth as string | undefined;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filePath: string) => deleteFile(filePath, { basicAuth: basicAuth! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", currentPath] });
      toast.success("Deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });
}

export function useMoveFile(currentPath: string) {
  const { data: session } = useSession();
  const basicAuth = (session as SessionData | null)?.basicAuth as string | undefined;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) =>
      moveFile(from, to, { basicAuth: basicAuth! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", currentPath] });
      toast.success("Moved");
    },
    onError: () => toast.error("Failed to move"),
  });
}

export function useCopyFile(currentPath: string) {
  const { data: session } = useSession();
  const basicAuth = (session as SessionData | null)?.basicAuth as string | undefined;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) =>
      copyFile(from, to, { basicAuth: basicAuth! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", currentPath] });
      toast.success("Copied");
    },
    onError: () => toast.error("Failed to copy"),
  });
}

export function useToggleFavorite(currentPath: string) {
  const { data: session } = useSession();
  const basicAuth = (session as SessionData | null)?.basicAuth as string | undefined;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ filePath, favorite }: { filePath: string; favorite: boolean }) =>
      toggleFavorite(filePath, favorite, { basicAuth: basicAuth! }),
    onSuccess: (_data, { favorite }) => {
      queryClient.invalidateQueries({ queryKey: ["files", currentPath] });
      toast.success(favorite ? "Added to favorites" : "Removed from favorites");
    },
    onError: () => toast.error("Failed to update favorite"),
  });
}

export function useFileActions(currentPath: string) {
  const createFolderMutation = useCreateFolder(currentPath);
  const deleteFileMutation = useDeleteFile(currentPath);
  const moveMutation = useMoveFile(currentPath);
  const copyMutation = useCopyFile(currentPath);
  const favoriteMutation = useToggleFavorite(currentPath);

  return {
    createFolder: createFolderMutation,
    deleteFile: deleteFileMutation,
    move: moveMutation,
    copy: copyMutation,
    toggleFavorite: favoriteMutation,
  };
}
