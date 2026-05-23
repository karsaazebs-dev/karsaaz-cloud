"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { listFiles, createFolder, deleteFile, moveFile, copyFile, toggleFavorite, createFile } from "@/lib/api/webdav";
import type { KarsaazFile } from "@/lib/types/file.types";
import { toast } from "sonner";
import { normalizePath } from "@/lib/utils/files";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

export function useFiles(path: string) {
  const { data: session } = useSession();
  const basicAuth = (session as SessionData | null)?.basicAuth as string | undefined;

  return useQuery({
    queryKey: ["files", path],
    queryFn: async () => {
      const raw = await listFiles(path, { basicAuth: basicAuth! });
      if (typeof window === "undefined") return raw;

      let savedFavsMap: Record<string, any> = {};
      try {
        const saved = localStorage.getItem("karsaaz-favorites");
        if (saved) {
          savedFavsMap = JSON.parse(saved);
        }
      } catch (e) {}

      return raw.map((f) => ({
        ...f,
        isFavorite: !!savedFavsMap[normalizePath(f.path)],
      }));
    },
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

export function useCreateFile(currentPath: string) {
  const { data: session } = useSession();
  const basicAuth = (session as SessionData | null)?.basicAuth as string | undefined;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, mimeType }: { name: string; mimeType: string }) =>
      createFile(`${currentPath}/${name}`, mimeType, { basicAuth: basicAuth! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", currentPath] });
      toast.success("File created");
    },
    onError: () => toast.error("Failed to create file"),
  });
}

export function useDeleteFile(currentPath: string) {
  const { data: session } = useSession();
  const basicAuth = (session as SessionData | null)?.basicAuth as string | undefined;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filePath: string) => deleteFile(filePath, { basicAuth: basicAuth! }),
    onSuccess: (_data, filePath) => {
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("karsaaz-favorites");
          if (saved) {
            const favs = JSON.parse(saved);
            const normPath = normalizePath(filePath);
            if (favs[normPath]) {
              delete favs[normPath];
              localStorage.setItem("karsaaz-favorites", JSON.stringify(favs));
            }
          }
        } catch (e) {}
      }
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
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
    onSuccess: (_data, { from, to }) => {
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("karsaaz-favorites");
          if (saved) {
            const favs = JSON.parse(saved);
            const normFrom = normalizePath(from);
            const normTo = normalizePath(to);
            if (favs[normFrom]) {
              const file = favs[normFrom];
              const newName = normTo.split("/").pop() || file.name;
              favs[normTo] = { ...file, path: normTo, name: newName };
              delete favs[normFrom];
              localStorage.setItem("karsaaz-favorites", JSON.stringify(favs));
            }
          }
        } catch (e) {}
      }
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
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
    onMutate: async ({ filePath, favorite }) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["files", currentPath] });

      // Snapshot current cache for rollback
      const previousFiles = queryClient.getQueryData<KarsaazFile[]>(["files", currentPath]);

      // Optimistically flip isFavorite on the matching file
      queryClient.setQueryData<KarsaazFile[]>(["files", currentPath], (old) =>
        old?.map((f) =>
          normalizePath(f.path) === normalizePath(filePath) ? { ...f, isFavorite: favorite } : f
        )
      );

      return { previousFiles };
    },
    onSuccess: (_data, { filePath, favorite }) => {
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("karsaaz-favorites");
          const favs = saved ? JSON.parse(saved) : {};
          const normPath = normalizePath(filePath);
          if (favorite) {
            let foundFile: KarsaazFile | undefined;
            const cache = queryClient.getQueryCache().getAll();
            for (const query of cache) {
              if (Array.isArray(query.queryKey) && query.queryKey[0] === "files") {
                const filesList = query.state.data as KarsaazFile[] | undefined;
                if (filesList) {
                  const match = filesList.find((f) => normalizePath(f.path) === normPath);
                  if (match) {
                    foundFile = match;
                    break;
                  }
                }
              }
            }

            if (!foundFile) {
              const name = normPath.split("/").pop() || "";
              const isFolder = normPath.includes("/files/") && !normPath.includes(".");
              foundFile = {
                id: normPath,
                fileId: Date.now(),
                name,
                path: normPath,
                type: isFolder ? "directory" : "file",
                mimeType: isFolder ? "httpd/unix-directory" : "application/octet-stream",
                fileType: isFolder ? "directory" : "other",
                size: 0,
                lastModified: new Date(),
                etag: "",
                permissions: 0,
                isFavorite: true,
                isShared: false,
                shareTypes: [],
                tags: [],
                hasPreview: false,
              };
            }

            favs[normPath] = { ...foundFile, path: normPath, isFavorite: true };
          } else {
            delete favs[normPath];
          }
          localStorage.setItem("karsaaz-favorites", JSON.stringify(favs));
        } catch (e) {
          console.error("Failed to update localStorage favorites:", e);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(favorite ? "Added to favorites" : "Removed from favorites");
    },
    onError: (_err, _vars, context) => {
      // Roll back the optimistic update
      if (context?.previousFiles) {
        queryClient.setQueryData(["files", currentPath], context.previousFiles);
      }
      toast.error("Failed to update favorite");
    },
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
