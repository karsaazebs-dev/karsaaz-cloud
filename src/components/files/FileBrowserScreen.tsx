/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useState, useEffect } from "react";
import { View, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import type { KarsaazFile } from "@karsaaz/cloud-api";
import { FilesBrowser } from "@/src/components/files/FilesBrowser";
import { FolderActionsSheet } from "@/src/components/files/FolderActionsSheet";
import { CreateFolderModal } from "@/src/components/files/CreateFolderModal";
import { UploadMenuSheet } from "@/src/components/files/UploadMenuSheet";
import { RenameModal } from "@/src/components/files/RenameModal";
import { FabSheet } from "@/src/components/files/FabSheet";
import { NewFolderDialog } from "@/src/components/files/NewFolderDialog";
import { CreateTagModal } from "@/src/components/files/CreateTagModal";
import { MoveToFolderModal } from "@/src/components/files/MoveToFolderModal";
import { useBrowseFiles } from "@/src/hooks/useBrowseFiles";
import { useAuthStore } from "@/src/stores/authStore";
import { useUiStore, type BrowseFilter } from "@/src/stores/uiStore";
import { useFavoritesStore } from "@/src/stores/favoritesStore";
import { formatFileSize, formatFileDate } from "@/src/utils/fileFilters";
import { phase1DebugLog } from "@/src/utils/phase1DebugLog";
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
  const [downloadingFilePath, setDownloadingFilePath] = useState<string | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderError, setNewFolderError] = useState<string | null>(null);
  const browseFilter = useUiStore((s) => s.browseFilter);
  const setActionFile = useUiStore((s) => s.setActionFile);
  const setActionFolder = useUiStore((s) => s.setActionFolder);
  const setShowCreateFolder = useUiStore((s) => s.setShowCreateFolder);
  const setShowCreateTag = useUiStore((s) => s.setShowCreateTag);
  const setShowUploadMenu = useUiStore((s) => s.setShowUploadMenu);
  const pendingUploadMenu = useUiStore((s) => s.pendingUploadMenu);
  const setPendingUploadMenu = useUiStore((s) => s.setPendingUploadMenu);
  const pendingFabSheet = useUiStore((s) => s.pendingFabSheet);
  const setPendingFabSheet = useUiStore((s) => s.setPendingFabSheet);
  const setShowFabSheet = useUiStore((s) => s.setShowFabSheet);
  const setShowAccountSwitcher = useUiStore((s) => s.setShowAccountSwitcher);
  const setShowMoveToFolder = useUiStore((s) => s.setShowMoveToFolder);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  const activeFilter = filter ?? browseFilter;
  const screenTitle = title ?? FILTER_TITLES[activeFilter];

  useEffect(() => {
    if (pendingUploadMenu) {
      setPendingUploadMenu(false);
      setShowUploadMenu(true);
    }
  }, [pendingUploadMenu, setPendingUploadMenu, setShowUploadMenu]);

  useEffect(() => {
    if (pendingFabSheet) {
      setPendingFabSheet(false);
      setShowFabSheet(true);
    }
  }, [pendingFabSheet, setPendingFabSheet, setShowFabSheet]);

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    deleteMutation,
    renameMutation,
    downloadMutation,
    mkdirMutation,
    favoriteMutation,
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
    // #region agent log
    phase1DebugLog(
      "FileBrowserScreen.tsx:handleMenu",
      "three-dot menu opened",
      {
        name: file.name,
        type: file.type,
        sheet: file.type === "directory" ? "FolderActionsSheet" : "FileDetailsSheet",
      },
      "H2"
    );
    // #endregion
    if (file.type === "directory") {
      setActionFolder(file);
    } else {
      setActionFile(file);
    }
  };

  const handleRename = (file: KarsaazFile) => {
    setRenameTarget(file);
  };

  const handleMove = (file: KarsaazFile) => {
    if (file.type === "directory") {
      setActionFile(null);
      setActionFolder(file);
    } else {
      setActionFolder(null);
      setActionFile(file);
    }
    setShowMoveToFolder(true);
  };

  const handleFavorite = (file: KarsaazFile) => {
    favoriteMutation.mutate(
      { file, favorite: !(file.isFavorite || false) },
      {
        onSuccess: () => toggleFavorite(file.path),
        onError: () => Alert.alert("Favorite", "Could not update favorite on server."),
      }
    );
  };

  const handleDownload = (file: KarsaazFile) => {
    setDownloadingFilePath(file.path);
    downloadMutation.mutate(file, {
      onSuccess: () => setDownloadingFilePath(null),
      onError: () => {
        setDownloadingFilePath(null);
        Alert.alert("Download", "Could not download file.");
      },
    });
  };

  const handleTags = (file: KarsaazFile) => {
    setActionFolder(null);
    setActionFile(file);
    setShowCreateTag(true);
  };

  const handleDelete = (file: KarsaazFile) => {
    const label = file.type === "directory" ? "folder" : "file";
    Alert.alert("Delete", `Delete ${label} "${file.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(file),
      },
    ]);
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

  const handleCreateNewFolder = async (name: string) => {
    setNewFolderError(null);
    try {
      await mkdirMutation.mutateAsync(name);
      setShowNewFolderDialog(false);
    } catch (e) {
      setNewFolderError(String(e));
    }
  };

  const handleFolderAction = (actionId: string, folder: KarsaazFile) => {
    switch (actionId) {
      case "details":
        Alert.alert(folder.name, `Modified: ${formatFileDate(folder.lastModified)}`);
        break;
      case "favorite":
      case "favourite":
        handleFavorite(folder);
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
        onAvatarPress={() => setShowAccountSwitcher(true)}
        onBackToDashboard={showBackToDashboard ? onBackToDashboard : undefined}
        onRename={handleRename}
        onMove={handleMove}
        onFavorite={handleFavorite}
        onDownload={handleDownload}
        downloadingFilePath={downloadingFilePath}
        onTags={handleTags}
        onDelete={handleDelete}
      />
      <UploadMenuSheet
        onUpload={pickDocument}
        onCreateFolder={() => setShowCreateFolder(true)}
        onTakePhoto={takePhoto}
      />
      <FabSheet
        onUpload={pickDocument}
        onNewFolder={() => setShowNewFolderDialog(true)}
      />
      <NewFolderDialog
        visible={showNewFolderDialog}
        onClose={() => { setShowNewFolderDialog(false); setNewFolderError(null); }}
        onCreate={handleCreateNewFolder}
        isPending={mkdirMutation.isPending}
        error={newFolderError}
      />
      <CreateFolderModal
        onCreate={(name) => mkdirMutation.mutate(name)}
        isPending={mkdirMutation.isPending}
      />
      <FolderActionsSheet onAction={handleFolderAction} />
      <CreateTagModal />
      <MoveToFolderModal />
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
