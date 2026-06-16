/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useQuery } from "@tanstack/react-query";
import { createWebDAVClient, getPathInfo, listDirectory } from "@karsaaz/cloud-api";
import type { KarsaazFile } from "@karsaaz/cloud-api";
import type { BrowseFilter } from "@/src/stores/uiStore";
import { useAuthStore } from "@/src/stores/authStore";
import { useFavoritesStore } from "@/src/stores/favoritesStore";
import { getCachedFilesByPaths, getRecentCachedFiles } from "@/src/sync/database";
import { cacheEntryToKarsaazFile } from "@/src/utils/cacheFileMapping";
import { debugLog } from "@/src/utils/debugLog";
import { useFiles } from "./useFiles";

function toRelPath(fullPath: string, username: string): string {
  const prefix = `/files/${username}`;
  if (fullPath.startsWith(prefix)) {
    return fullPath.slice(prefix.length) || "/";
  }
  return fullPath.startsWith("/") ? fullPath : `/${fullPath}`;
}

async function loadFavoriteFiles(
  favoritePaths: string[],
  username: string,
  password: string
): Promise<KarsaazFile[]> {
  const rows = await getCachedFilesByPaths(favoritePaths);
  const files = rows.map(cacheEntryToKarsaazFile);
  const found = new Set(files.map((f) => f.path));
  const missing = favoritePaths.filter((p) => !found.has(p));
  if (missing.length === 0) return files;

  const client = createWebDAVClient(username, password);
  for (const path of missing) {
    const rel = toRelPath(path, username);
    const stat = await getPathInfo(client, username, rel);
    if (stat) files.push(stat);
  }
  return files;
}

async function loadRecentFiles(
  username: string,
  password: string
): Promise<KarsaazFile[]> {
  const client = createWebDAVClient(username, password);
  const root = await listDirectory(client, username, "/");
  return root
    .filter((f: KarsaazFile) => f.type === "file")
    .sort((a: KarsaazFile, b: KarsaazFile) => b.lastModified.getTime() - a.lastModified.getTime())
    .slice(0, 50);
}

export function useBrowseFiles(currentPath: string, browseFilter: BrowseFilter) {
  const username = useAuthStore((s) => s.username);
  const appPassword = useAuthStore((s) => s.appPassword);
  const favoritePaths = useFavoritesStore((s) => s.paths);
  const dirQuery = useFiles(currentPath);

  const isVirtual = browseFilter === "recent" || browseFilter === "favorites";

  const virtualQuery = useQuery({
    queryKey: ["browse-virtual", browseFilter, favoritePaths.join("|"), username],
    queryFn: async () => {
      if (!username || !appPassword) return [];

      if (browseFilter === "recent") {
        const cachedRows = await getRecentCachedFiles(50);
        if (cachedRows.length > 0) {
          const files = cachedRows.map(cacheEntryToKarsaazFile);
          debugLog(
            "useBrowseFiles.ts:recent",
            "recent virtual loaded",
            { count: files.length, source: "cache" },
            "F",
            "post-fix"
          );
          return files;
        }
        const files = await loadRecentFiles(username, appPassword);
        debugLog(
          "useBrowseFiles.ts:recent",
          "recent virtual loaded",
          { count: files.length, source: "api" },
          "F",
          "post-fix"
        );
        return files;
      }

      const files = await loadFavoriteFiles(favoritePaths, username, appPassword);
      debugLog(
        "useBrowseFiles.ts:favorites",
        "favorites virtual loaded",
        { count: files.length, favoritePaths: favoritePaths.length },
        "F",
        "post-fix"
      );
      return files;
    },
    enabled: isVirtual && Boolean(username && appPassword),
  });

  if (isVirtual) {
    return {
      data: virtualQuery.data,
      isLoading: virtualQuery.isLoading,
      isRefetching: virtualQuery.isFetching,
      refetch: async () => {
        await dirQuery.refetch();
        await virtualQuery.refetch();
      },
      deleteMutation: dirQuery.deleteMutation,
      renameMutation: dirQuery.renameMutation,
      downloadMutation: dirQuery.downloadMutation,
      mkdirMutation: dirQuery.mkdirMutation,
      favoriteMutation: dirQuery.favoriteMutation,
      uploadMutation: dirQuery.uploadMutation,
    };
  }

  return dirQuery;
}
