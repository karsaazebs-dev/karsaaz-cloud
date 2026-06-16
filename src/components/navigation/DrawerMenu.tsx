/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:1939 — sidebar drawer with expandable Files section
 */

import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/stores/authStore";
import { useUiStore, type DrawerItemId } from "@/src/stores/uiStore";
import { figmaAssets } from "@/src/constants/assets";
import { theme } from "@/src/constants/theme";

interface FileSubItem {
  id: DrawerItemId;
  label: string;
  icon: number;
}

const FILE_SUB_ITEMS: FileSubItem[] = [
  { id: "recent_files", label: "Recent files", icon: figmaAssets.drawer.recent },
  { id: "all_files", label: "All files", icon: figmaAssets.drawer.allFiles },
  { id: "personal_files", label: "Personal files", icon: figmaAssets.drawer.personal },
  { id: "favorites", label: "Favorites", icon: figmaAssets.drawer.favorites },
  { id: "shared", label: "Shared", icon: figmaAssets.drawer.shared },
];

interface StandaloneItem {
  id: DrawerItemId;
  label: string;
  icon: number;
}

const STANDALONE_ITEMS: StandaloneItem[] = [
  { id: "activities", label: "Activities", icon: figmaAssets.drawer.activities },
  { id: "media", label: "Media", icon: figmaAssets.drawer.media },
  { id: "uploads", label: "Uploads", icon: figmaAssets.drawer.uploads },
  { id: "on_device", label: "On device", icon: figmaAssets.drawer.onDevice },
  { id: "trashbin", label: "Deleted files", icon: figmaAssets.drawer.deleted },
  { id: "settings", label: "Settings", icon: figmaAssets.drawer.settings },
];

const FILE_ITEM_IDS = new Set<DrawerItemId>([
  "recent_files",
  "all_files",
  "personal_files",
  "favorites",
  "shared",
]);

interface DrawerMenuProps {
  onBrowse: (item: DrawerItemId) => void;
}

export function DrawerMenu({ onBrowse }: DrawerMenuProps) {
  const router = useRouter();
  const open = useUiStore((s) => s.drawerOpen);
  const active = useUiStore((s) => s.activeDrawerItem);
  const setOpen = useUiStore((s) => s.setDrawerOpen);
  const setActive = useUiStore((s) => s.setActiveDrawerItem);
  const setBrowseFilter = useUiStore((s) => s.setBrowseFilter);
  const setBrowsePath = useUiStore((s) => s.setBrowsePath);
  const setAccountSwitcher = useUiStore((s) => s.setShowAccountSwitcher);
  const displayName = useAuthStore((s) => s.displayName);
  const username = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);
  const [filesExpanded, setFilesExpanded] = useState(true);

  const filesActive = FILE_ITEM_IDS.has(active);

  const handleSelect = (item: DrawerItemId) => {
    setActive(item);
    setOpen(false);

    if (item === "shared") {
      setBrowseFilter("all");
      setBrowsePath("/");
      router.push("/(tabs)/files");
      return;
    }
    if (item === "favorites") {
      setBrowseFilter("favorites");
      setBrowsePath("/");
      router.push("/(tabs)/files");
      return;
    }
    if (item === "activities") {
      router.push("/share" as any);
      return;
    }
    if (item === "media") {
      router.push("/(tabs)/photos");
      return;
    }
    // settings and trashbin are not in current Figma scope — close drawer only
    if (item === "settings" || item === "trashbin") {
      return;
    }
    onBrowse(item);
  };

  const renderMenuRow = (
    item: { id: DrawerItemId; label: string; icon: number },
    options?: { indent?: boolean }
  ) => {
    const selected = active === item.id;
    return (
      <Pressable
        key={item.id}
        style={[
          styles.menuItem,
          options?.indent && styles.menuItemIndent,
          selected && styles.menuItemActive,
        ]}
        onPress={() => handleSelect(item.id)}
      >
        {selected && (
          <Image source={figmaAssets.drawer.activeBar} style={styles.activeBar} />
        )}
        <Image source={item.icon} style={styles.menuIcon} />
        <Text style={[styles.menuLabel, selected && styles.menuLabelActive]}>
          {item.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
        <Pressable style={styles.drawer} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={[theme.colors.drawerHeaderStart, theme.colors.drawerHeaderEnd]}
            style={styles.header}
          >
            <Pressable style={styles.profileRow} onPress={() => setAccountSwitcher(true)}>
              <Image source={figmaAssets.drawer.avatar} style={styles.avatar} />
              <View style={styles.profileMeta}>
                <Text style={styles.profileName}>{displayName}</Text>
                <Text style={styles.profileEmail}>{username}</Text>
              </View>
              <Image source={figmaAssets.drawer.chevronDown} style={styles.chevron} />
            </Pressable>
          </LinearGradient>

          <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
            <Pressable
              style={[styles.menuItem, filesActive && styles.menuItemActive]}
              onPress={() => setFilesExpanded((v) => !v)}
            >
              {filesActive && (
                <Image source={figmaAssets.drawer.activeBar} style={styles.activeBar} />
              )}
              <Image source={figmaAssets.drawer.files} style={styles.menuIcon} />
              <Text style={[styles.menuLabel, filesActive && styles.menuLabelActive]}>
                Files
              </Text>
              <Image
                source={figmaAssets.drawer.chevronDown}
                style={[styles.chevronSmall, !filesExpanded && styles.chevronCollapsed]}
              />
            </Pressable>

            {filesExpanded &&
              FILE_SUB_ITEMS.map((item) => renderMenuRow(item, { indent: true }))}

            {STANDALONE_ITEMS.map((item) => renderMenuRow(item))}
          </ScrollView>

          <Pressable
            style={styles.logoutBtn}
            onPress={async () => {
              setOpen(false);
              await logout();
            }}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    flexDirection: "row",
  },
  drawer: {
    width: 300,
    backgroundColor: theme.colors.surface,
    height: "100%",
    borderTopRightRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    resizeMode: "cover",
  },
  profileMeta: { flex: 1 },
  profileName: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  profileEmail: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    width: 16,
    height: 16,
    resizeMode: "contain",
    tintColor: "#ffffff",
  },
  chevronSmall: {
    width: 12,
    height: 12,
    resizeMode: "contain",
    tintColor: theme.colors.textMuted,
  },
  chevronCollapsed: {
    transform: [{ rotate: "-90deg" }],
  },
  menu: { flex: 1 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    position: "relative",
    minHeight: 48,
  },
  menuItemIndent: {
    paddingLeft: 44,
  },
  menuItemActive: {
    backgroundColor: theme.colors.infoBg,
  },
  activeBar: {
    position: "absolute",
    right: 0,
    top: 8,
    bottom: 8,
    width: 4,
    resizeMode: "stretch",
  },
  menuIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  menuLabelActive: {
    color: theme.colors.accentText,
    fontWeight: "600",
  },
  logoutBtn: {
    marginHorizontal: 20,
    marginBottom: 28,
    backgroundColor: theme.colors.tabBar,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 15,
  },
});
