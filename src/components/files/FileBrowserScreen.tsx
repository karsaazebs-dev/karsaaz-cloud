/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useState } from "react";
import { View, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import type { KarsaazFile } from "@karsaaz/cloud-api";
import { FilesBrowser } from "@/src/components/files/FilesBrowser";
import { FileActionsSheet } from "@/src/components/files/FileActionsSheet";
import { FolderActionsSheet } from "@/src/components/files/FolderActionsSheet";
import { CreateFolderModal } from "@/src/components/files/CreateFolderModal";
import { UploadMenuSheet } from "@/src/components/files/UploadMenuSheet";
import { RenameModal } from "@/src/components/files/RenameModal";
import { useBrowseFiles } from "@/src/hooks/useBrowseFiles";
import { useAuthStore } from "@/src/stores/authStore";
import { useUiStore, type BrowseFilter } from "@/src/stores/uiStore";
import { useFavoritesStore } from "@/src/stores/favoritesStore";
import { formatFileSize, formatFileDate } from "@/src/utils/fileFilters";
import { theme } from "@/src/constants/theme";

const FILTER_TITLES: Record<BrowseFilter, string> = {
  all: "All files",
  recent: "Recent files",
  personal: "Personal files",
  favorites: "Favorites",
};

interface FileBrowserScreenProps {
  title?: string;
  filter?: BrowseFilter;
  initialPath?: string;
  showBackToDashboard?: boolean;
  onBackToDashboard?: () => void;
}

export function FileBrowserScreen({
  title,
  filter,
  initialPath = "/",
  showBackToDashboard,
  onBackToDashboard,
}: FileBrowserScreenProps) {
  const router = useRouter();
  const username = useAuthStore((s) => s.username);
  const [path, setPath] = useState(initialPath);
  const [renameTarget, setRenameTarget] = useState<KarsaazFile | null>(null);
  const browseFilter = useUiStore((s) => s.browseFilter);
  const setActionFile = useUiStore((s) => s.setActionFile);
  const setActionFolder = useUiStore((s) => s.setActionFolder);
  const setShowCreateFolder = useUiStore((s) => s.setShowCreateFolder);
  const setShowCreateTag = useUiStore((s) => s.setShowCreateTag);
  const setShowUploadMenu = useUiStore((s) => s.setShowUploadMenu);
  const setShowAccountSwitcher = useUiStore((s) => s.setShowAccountSwitcher);
  const setShowMoveToFolder = useUiStore((s) => s.setShowMoveToFolder);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  const activeFilter = filter ?? browseFilter;
  const screenTitle = title ?? FILTER_TITLES[activeFilter];

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    deleteMutation,
    renameMutation,
    downloadMutation,
    mkdirMutation,
    uploadMutation,
  } = useBrowseFiles(path, activeFilter);

  const listFilter =
    activeFilter === "recent" || activeFilter === "favorites" ? "all" : activeFilter;

  const handleOpen = (file: KarsaazFile) => {
    if (file.type === "directory") {
      const rel = file.path.replace(`/files/${username}`, "") || "/";
      if (activeFilter === "recent" || activeFilter === "favorites") {
        useUiStore.getState().setBrowseFilter("all");
      }
      setPath(rel);
      return;
    }
    router.push({
      pathname: "/preview",
      params: { path: file.path, name: file.name, mime: file.mimeType },
    });
  };

  const handleShare = (file: KarsaazFile) => {
    const rel = file.path.replace(`/files/${username}`, "");
    router.push({
      pathname: "/share",
      params: { path: rel, name: file.name },
    });
  };

  const handleMenu = (file: KarsaazFile) => {
    if (file.type === "directory") {
      setActionFolder(file);
    } else {
      setActionFile(file);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync();
    if (!result.canceled && result.assets[0]) {
      uploadMutation.mutate({
        uri: result.assets[0].uri,
        name: result.assets[0].name,
      });
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      uploadMutation.mutate({ uri: result.assets[0].uri, name: `photo-${Date.now()}.jpg` });
    }
  };

  const handleFileAction = (actionId: string, file: KarsaazFile) => {
    switch (actionId) {
      case "edit":
      case "rename":
        setRenameTarget(file);
        break;
      case "details":
        Alert.alert(
          file.name,
          `Size: ${formatFileSize(file.size)}\nModified: ${formatFileDate(file.lastModified)}\nType: ${file.mimeType}`
        );
        break;
      case "download":
      case "export":
        downloadMutation.mutate(file);
        break;
      case "share":
        handleShare(file);
        break;
      case "wallpaper":
        Alert.alert("Use picture as", "Set as wallpaper is not supported on this platform yet.");
        break;
      case "move":
        setActionFile(file);
        setShowMoveToFolder(true);
        break;
      case "delete":
        Alert.alert("Delete", `Delete "${file.name}"?`, [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(file) },
        ]);
        break;
    }
  };

  const handleFolderAction = (actionId: string, folder: KarsaazFile) => {
    switch (actionId) {
      case "details":
        Alert.alert(folder.name, `Modified: ${formatFileDate(folder.lastModified)}`);
        break;
      case "favorite":
        toggleFavorite(folder.path);
        break;
      case "tag":
        setActionFolder(folder);
        setShowCreateTag(true);
        break;
      case "rename":
      case "edit":
        setRenameTarget(folder);
        break;
      case "export":
      case "share":
        handleShare(folder);
        break;
      case "sync":
        refetch();
        break;
      case "pin":
        Alert.alert("Pin", "Pin to device is not available yet.");
        break;
      case "move":
        setActionFolder(folder);
        setShowMoveToFolder(true);
        break;
      case "delete":
        Alert.alert("Delete", `Delete folder "${folder.name}"?`, [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(folder) },
        ]);
        break;
    }
  };

  return (
    <View style={styles.container}>
      <FilesBrowser
        files={data ?? []}
        isLoading={isLoading}
        isRefetching={isRefetching}
        title={screenTitle}
        filter={listFilter}
        onRefresh={() => refetch()}
        onOpen={handleOpen}
        onShare={handleShare}
        onMenu={handleMenu}
        onFabPress={() => setShowUploadMenu(true)}
        onAvatarPress={() => setShowAccountSwitcher(true)}
        onBackToDashboard={showBackToDashboard ? onBackToDashboard : undefined}
      />
      <UploadMenuSheet
        onUpload={pickDocument}
        onCreateFolder={() => setShowCreateFolder(true)}
        onTakePhoto={takePhoto}
      />
      <CreateFolderModal
        onCreate={(name) => mkdirMutation.mutate(name)}
        isPending={mkdirMutation.isPending}
      />
      <FileActionsSheet onAction={handleFileAction} />
      <FolderActionsSheet onAction={handleFolderAction} />
      <RenameModal
        file={renameTarget}
        onClose={() => setRenameTarget(null)}
        onRename={(file, newName) => renameMutation.mutate({ file, newName })}
        isPending={renameMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
});
