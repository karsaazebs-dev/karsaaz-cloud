/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:640 — Dashboard / Home screen
 */

import { DashboardView, type QuickAccessId } from "@/src/components/home/DashboardView";
import { RequestStorageModal } from "@/src/components/storage/RequestStorageModal";
import { theme } from "@/src/constants/theme";
import { useFiles } from "@/src/hooks/useFiles";
import { useUserQuota } from "@/src/hooks/useUserQuota";
import { useAuthStore } from "@/src/stores/authStore";
import { useUiStore, type BrowseFilter } from "@/src/stores/uiStore";
import type { KarsaazFile } from "@karsaaz/cloud-api";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

export default function DashboardScreen() {
  const router = useRouter();
  const displayName = useAuthStore((s) => s.displayName);
  const setBrowseFilter = useUiStore((s) => s.setBrowseFilter);
  const setShowAccountSwitcher = useUiStore((s) => s.setShowAccountSwitcher);
  const setShowNotEnoughStorage = useUiStore((s) => s.setShowNotEnoughStorage);

  const [showRequestModal, setShowRequestModal] = useState(false);

  const { data } = useFiles("/");
  const { data: userQuota } = useUserQuota();

  useEffect(() => {
    if (userQuota?.quota) {
      const used = userQuota.quota.used ?? 0;
      const total = userQuota.quota.total ?? 0;
      if (total > 0 && used / total >= 0.98) {
        setShowNotEnoughStorage(true);
      }
    }
  }, [userQuota, setShowNotEnoughStorage]);

  const handleOpenFile = (file: KarsaazFile) => {
    if (file.type === "directory") {
      router.push("/(tabs)/files");
      return;
    }
    router.push({
      pathname: "/preview",
      params: { path: file.path, name: file.name, mime: file.mimeType },
    });
  };

  const handleViewAll = (_section: "folders" | "recent" | "shared", filter: BrowseFilter) => {
    setBrowseFilter(filter);
    router.push("/(tabs)/files");
  };

  const handleQuickAccess = (item: QuickAccessId) => {
    if (item === "more") {
      useUiStore.getState().setDrawerOpen(true);
      return;
    }
    if (item === "favorites") {
      setBrowseFilter("favorites");
    } else if (item === "shared") {
      setBrowseFilter("all");
    } else if (item === "videos") {
      setBrowseFilter("all");
    } else if (item === "docs") {
      setBrowseFilter("all");
    } else if (item === "pdf") {
      setBrowseFilter("all");
    }
    router.push("/(tabs)/files");
  };

  const handleLegendPress = (category: string) => {
    // Map dashboard legend labels to manage-storage tab names
    const tabMap: Record<string, string> = {
      Images: "Photos",
      Documents: "Documents",
      Videos: "Videos",
      Others: "Others",
    };
    const tab = tabMap[category] ?? "Photos";
    router.push({ pathname: "/manage-storage" as any, params: { tab } });
  };

  return (
    <View style={styles.container}>
      <DashboardView
        files={data ?? []}
        displayName={displayName || "User"}
        onOpenFolder={handleOpenFile}
        onOpenFile={handleOpenFile}
        onViewAll={handleViewAll}
        onQuickAccess={handleQuickAccess}
        onAvatarPress={() => setShowAccountSwitcher(true)}
        onManageStorage={() => router.push("/manage-storage" as any)}
        onRequestStorage={() => setShowRequestModal(true)}
        onLegendPress={handleLegendPress}
      />
      <RequestStorageModal
        visible={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
});
