/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useState, useCallback, useEffect } from "react";
import { useFocusEffect } from "expo-router";
import { View, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import type { KarsaazFile } from "@karsaaz/cloud-api";
import { DashboardView, type QuickAccessId } from "@/src/components/home/DashboardView";
import { HomeFab } from "@/src/components/home/HomeFab";
import { FileBrowserScreen } from "@/src/components/files/FileBrowserScreen";
import { FileActionsSheet } from "@/src/components/files/FileActionsSheet";
import { FolderActionsSheet } from "@/src/components/files/FolderActionsSheet";
import { CreateFolderModal } from "@/src/components/files/CreateFolderModal";
import { UploadMenuSheet } from "@/src/components/files/UploadMenuSheet";
import { RenameModal } from "@/src/components/files/RenameModal";
import { useFiles } from "@/src/hooks/useFiles";
import { useAuthStore } from "@/src/stores/authStore";
import { useUiStore, type BrowseFilter } from "@/src/stores/uiStore";
import { useFavoritesStore } from "@/src/stores/favoritesStore";
import { formatFileSize, formatFileDate } from "@/src/utils/fileFilters";
import { theme } from "@/src/constants/theme";
import { debugLog } from "@/src/utils/debugLog";

export default function FilesScreen() {
  const router = useRouter();
  const displayName = useAuthStore((s) => s.displayName);
  const username = useAuthStore((s) => s.username);
  const [renameTarget, setRenameTarget] = useState<KarsaazFile | null>(null);
  const browseMode = useUiStore((s) => s.browseMode);
  const browsePath = useUiStore((s) => s.browsePath);
  const setBrowseMode = useUiStore((s) => s.setBrowseMode);
  const setBrowsePath = useUiStore((s) => s.setBrowsePath);
  const setBrowseFilter = useUiStore((s) => s.setBrowseFilter);
  const setSearchQuery = useUiStore((s) => s.setSearchQuery);
  const setActionFile = useUiStore((s) => s.setActionFile);
  const setActionFolder = useUiStore((s) => s.setActionFolder);
  const setShowCreateFolder = useUiStore((s) => s.setShowCreateFolder);
  const setShowCreateTag = useUiStore((s) => s.setShowCreateTag);
  const setShowUploadMenu = useUiStore((s) => s.setShowUploadMenu);
  const setShowAccountSwitcher = useUiStore((s) => s.setShowAccountSwitcher);
  const setDrawerOpen = useUiStore((s) => s.setDrawerOpen);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  useFocusEffect(
    useCallback(() => {
      debugLog(
        "files.tsx:focus",
        "files tab focused",
        { browseMode: useUiStore.getState().browseMode, browsePath: useUiStore.getState().browsePath },
        "B",
        "post-fix"
      );
    }, [])
  );

  const {
    data,
    refetch,
    deleteMutation,
    renameMutation,
    downloadMutation,
    mkdirMutation,
    uploadMutation,
  } = useFiles("/");

  useEffect(() => {
    debugLog(
      "files.tsx:branch",
      "files screen branch",
      {
        browseMode,
        browsePath,
        fileCount: data?.length ?? 0,
        view: browseMode ? "FileBrowserScreen" : "DashboardView",
      },
      "B",
      "post-fix"
    );
  }, [browseMode, browsePath, data?.length]);

  const goToBrowse = (filter: BrowseFilter, section: string) => {
    setBrowseFilter(filter);
    setBrowsePath("/");
    setBrowseMode(false);
    setSearchQuery("");
    debugLog(
      "files.tsx:goToBrowse",
      "dashboard navigate to search",
      { section, filter },
      "B",
      "post-fix"
    );
    router.push("/(tabs)/shared");
  };

  const handleQuickAccess = (item: QuickAccessId) => {
    if (item === "favorites") {
      setBrowseMode(false);
      router.push("/(tabs)/favorites");
      return;
    }
    if (item === "shared") {
      setBrowseMode(false);
      router.push("/(tabs)/shared");
      return;
    }
    if (item === "videos") {
      setBrowseFilter("all");
      setBrowsePath("/");
      setBrowseMode(false);
      setSearchQuery("video");
      router.push("/(tabs)/shared");
      return;
    }
    if (item === "more") {
      setDrawerOpen(true);
      return;
    }
    setBrowseFilter("all");
    setBrowsePath("/");
    setBrowseMode(false);
    setSearchQuery(item === "pdf" ? ".pdf" : item === "docs" ? "doc" : "");
    router.push("/(tabs)/shared");
  };

  const handleOpen = (file: KarsaazFile) => {
    if (file.type === "directory") {
      const rel = file.path.replace(`/files/${username}`, "") || "/";
      setBrowsePath(rel);
      setBrowseMode(true);
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
      case "delete":
        Alert.alert("Delete", `Delete folder "${folder.name}"?`, [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(folder) },
        ]);
        break;
    }
  };

  if (browseMode) {
    return (
      <FileBrowserScreen
        initialPath={browsePath}
        showBackToDashboard
        onBackToDashboard={() => {
          debugLog(
            "files.tsx:back",
            "returning to dashboard",
            { browsePath },
            "B",
            "post-fix"
          );
          setBrowseMode(false);
          setBrowsePath("/");
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <DashboardView
        files={data ?? []}
        displayName={displayName || "User"}
        onOpenFolder={handleOpen}
        onOpenFile={handleOpen}
        onViewAll={(section, filter) => goToBrowse(filter, section)}
        onQuickAccess={handleQuickAccess}
        onAvatarPress={() => setShowAccountSwitcher(true)}
        onFileMenu={handleMenu}
        onFolderMenu={handleMenu}
      />
      <HomeFab onPress={() => setShowUploadMenu(true)} />
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
