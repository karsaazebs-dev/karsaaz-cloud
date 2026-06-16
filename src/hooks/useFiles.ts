/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Buffer } from "buffer";
import {
  createWebDAVClient,
  listDirectory,
  deleteItem,
  createDirectory,
  uploadFile,
  downloadFile,
  moveFile,
  setFavorite,
  type KarsaazFile,
} from "@karsaaz/cloud-api";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useAuthStore } from "../stores/authStore";
import { cacheFileMetadata } from "../sync/database";
import { queueFileUpload } from "../sync/syncEngine";

function useCredentials() {
  const { username, appPassword } = useAuthStore();
  return { username, password: appPassword };
}

function toRelPath(file: KarsaazFile, username: string): string {
  return file.path.replace(`/files/${username}`, "") || "/";
}

export function useFiles(currentPath: string) {
  const { username, password } = useCredentials();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["files", username, currentPath],
    queryFn: async () => {
      const client = createWebDAVClient(username, password);
      const files = await listDirectory(client, username, currentPath);
      for (const f of files) {
        await cacheFileMetadata({
          path: f.path,
          etag: f.etag,
          name: f.name,
          mimeType: f.mimeType,
          size: f.size,
          isDirectory: f.type === "directory",
          lastModified: f.lastModified.toISOString(),
        });
      }
      return files.sort((a: KarsaazFile, b: KarsaazFile) => {
        if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    },
    enabled: Boolean(username && password),
  });

  const deleteMutation = useMutation({
    mutationFn: async (file: KarsaazFile) => {
      const client = createWebDAVClient(username, password);
      await deleteItem(client, username, toRelPath(file, username));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", username] }),
  });

  const renameMutation = useMutation({
    mutationFn: async (params: { file: KarsaazFile; newName: string }) => {
      const client = createWebDAVClient(username, password);
      const relPath = toRelPath(params.file, username);
      const parent = relPath.substring(0, relPath.lastIndexOf("/")) || "";
      const dest = `${parent}/${params.newName}`;
      await moveFile(client, username, relPath, dest);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", username] }),
  });

  const moveMutation = useMutation({
    mutationFn: async (params: { file: KarsaazFile; targetFolderPath: string }) => {
      const client = createWebDAVClient(username, password);
      const relPath = toRelPath(params.file, username);
      const dest = `${params.targetFolderPath === "/" ? "" : params.targetFolderPath}/${params.file.name}`;
      await moveFile(client, username, relPath, dest);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", username] }),
  });

  const downloadMutation = useMutation({
    mutationFn: async (file: KarsaazFile) => {
      const client = createWebDAVClient(username, password);
      const relPath = toRelPath(file, username);
      const buffer = await downloadFile(client, username, relPath);
      const base64 = buffer.toString("base64");
      const localUri = `${FileSystem.cacheDirectory}${file.name}`;
      await FileSystem.writeAsStringAsync(localUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localUri);
      }
      return localUri;
    },
  });

  const mkdirMutation = useMutation({
    mutationFn: async (name: string) => {
      const client = createWebDAVClient(username, password);
      const path = `${currentPath === "/" ? "" : currentPath}/${name}`;
      await createDirectory(client, username, path);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", username, currentPath] }),
  });

  const favoriteMutation = useMutation({
    mutationFn: async (params: { file: KarsaazFile; favorite: boolean }) => {
      const client = createWebDAVClient(username, password);
      await setFavorite(client, username, toRelPath(params.file, username), params.favorite);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", username] }),
  });

  const uploadMutation = useMutation({
    mutationFn: async (params: { uri: string; name: string }) => {
      const client = createWebDAVClient(username, password);
      const remotePath = `${currentPath === "/" ? "" : currentPath}/${params.name}`;
      const base64 = await FileSystem.readAsStringAsync(params.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await uploadFile(client, username, remotePath, Buffer.from(base64, "base64"));
      await queueFileUpload({
        id: `${Date.now()}-${params.name}`,
        remotePath,
        localUri: params.uri,
        name: params.name,
        size: 0,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["files", username, currentPath] }),
  });

  return {
    ...query,
    deleteMutation,
    renameMutation,
    moveMutation,
    downloadMutation,
    mkdirMutation,
    favoriteMutation,
    uploadMutation,
  };
}
