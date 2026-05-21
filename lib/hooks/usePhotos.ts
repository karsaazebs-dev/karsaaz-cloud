"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { listFilesDeep, listFiles } from "@/lib/api/webdav";
import type { KarsaazFile } from "@/lib/types/file.types";

type SessionData = { basicAuth?: string; username?: string } & Record<string, unknown>;

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/bmp",
  "image/tiff",
  "image/svg+xml",
]);

export function isImage(file: KarsaazFile): boolean {
  return IMAGE_MIMES.has(file.mimeType);
}

function useAuth() {
  const { data: session } = useSession();
  const s = session as SessionData | null;
  return {
    basicAuth: s?.basicAuth as string | undefined,
    username: s?.username as string | undefined,
  };
}

export function usePhotos() {
  const { basicAuth, username } = useAuth();
  return useQuery({
    queryKey: ["photos", username],
    queryFn: async () => {
      const roots = [
        `/remote.php/dav/files/${username}/Photos`,
        `/remote.php/dav/files/${username}/Camera`,
        `/remote.php/dav/files/${username}/Pictures`,
      ];
      const results = await Promise.allSettled(
        roots.map((p) => listFilesDeep(p, { basicAuth: basicAuth! }))
      );
      const all: KarsaazFile[] = [];
      for (const r of results) {
        if (r.status === "fulfilled") all.push(...r.value.filter(isImage));
      }
      // fallback: if nothing found scan root and filter images
      if (all.length === 0) {
        const root = await listFilesDeep(
          `/remote.php/dav/files/${username}/`,
          { basicAuth: basicAuth! }
        );
        all.push(...root.filter(isImage));
      }
      return all.sort(
        (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );
    },
    enabled: !!basicAuth && !!username,
    staleTime: 2 * 60_000,
  });
}

export function useAlbums() {
  const { basicAuth, username } = useAuth();
  return useQuery({
    queryKey: ["albums", username],
    queryFn: async () => {
      // Albums = directories containing at least one image
      const root = await listFilesDeep(
        `/remote.php/dav/files/${username}/`,
        { basicAuth: basicAuth! }
      );
      const dirs = root.filter((f) => f.type === "directory");
      const imagesByDir: Record<string, KarsaazFile[]> = {};
      for (const img of root.filter(isImage)) {
        const parts = img.path.split("/");
        parts.pop(); // remove filename
        const dir = parts.join("/");
        if (!imagesByDir[dir]) imagesByDir[dir] = [];
        imagesByDir[dir].push(img);
      }
      return dirs
        .filter((d) => imagesByDir[d.path]?.length)
        .map((d) => ({
          ...d,
          photos: imagesByDir[d.path] ?? [],
          cover: imagesByDir[d.path]?.[0],
        }))
        .sort((a, b) => b.photos.length - a.photos.length);
    },
    enabled: !!basicAuth && !!username,
    staleTime: 2 * 60_000,
  });
}

export function useAlbumPhotos(albumPath: string) {
  const { basicAuth, username } = useAuth();
  return useQuery({
    queryKey: ["albumPhotos", albumPath],
    queryFn: async () => {
      const files = await listFilesDeep(albumPath, { basicAuth: basicAuth! });
      return files
        .filter(isImage)
        .sort(
          (a, b) =>
            new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
        );
    },
    enabled: !!basicAuth && !!username && !!albumPath,
    staleTime: 60_000,
  });
}
