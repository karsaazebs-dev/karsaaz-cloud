/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/stores/authStore";
import { useUiStore, type DrawerItemId } from "@/src/stores/uiStore";
import { theme } from "@/src/constants/theme";

interface DrawerItem {
  id: DrawerItemId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ITEMS: DrawerItem[] = [
  { id: "all_files", label: "All files", icon: "folder-outline" },
  { id: "recent_files", label: "Recent files", icon: "time-outline" },
  { id: "personal_files", label: "Personal files", icon: "person-outline" },
  { id: "favorites", label: "Favorites", icon: "star-outline" },
  { id: "shared", label: "Shared", icon: "share-social-outline" },
  { id: "activities", label: "Activities", icon: "pulse-outline" },
  { id: "media", label: "Media", icon: "image-outline" },
  { id: "uploads", label: "Uploads", icon: "cloud-upload-outline" },
  { id: "on_device", label: "On device", icon: "phone-portrait-outline" },
  { id: "trashbin", label: "Deleted files", icon: "trash-outline" },
  { id: "settings", label: "Settings", icon: "settings-outline" },
];

interface DrawerMenuProps {
  onBrowse: (item: DrawerItemId) => void;
}

export function DrawerMenu({ onBrowse }: DrawerMenuProps) {
  const router = useRouter();
  const open = useUiStore((s) => s.drawerOpen);
  const active = useUiStore((s) => s.activeDrawerItem);
  const setOpen = useUiStore((s) => s.setDrawerOpen);
  const setActive = useUiStore((s) => s.setActiveDrawerItem);
  const setAccountSwitcher = useUiStore((s) => s.setShowAccountSwitcher);
  const displayName = useAuthStore((s) => s.displayName);
  const username = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);

  const handleSelect = (item: DrawerItemId) => {
    setActive(item);
    setOpen(false);

    if (item === "shared") {
      router.push("/(tabs)/shared");
      return;
    }
    if (item === "favorites") {
      router.push("/(tabs)/favorites");
      return;
    }
    if (item === "activities") {
      router.push("/(tabs)/activity");
      return;
    }
    if (item === "media") {
      router.push("/(tabs)/photos");
      return;
    }
    if (item === "settings") {
      router.push("/(tabs)/settings");
      return;
    }
    if (item === "trashbin") {
      router.push("/(tabs)/trash");
      return;
    }
    onBrowse(item);
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
        <Pressable style={styles.drawer} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
            style={styles.header}
          >
            <Pressable style={styles.profileRow} onPress={() => setAccountSwitcher(true)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.profileMeta}>
                <Text style={styles.profileName}>{displayName}</Text>
                <Text style={styles.profileEmail}>{username}</Text>
              </View>
              <Ionicons name="chevron-down" size={16} color="#fff" />
            </Pressable>
          </LinearGradient>

          <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
            {ITEMS.map((item) => {
              const selected = active === item.id;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.menuItem, selected && styles.menuItemActive]}
                  onPress={() => handleSelect(item.id)}
                >
                  {selected && <View style={styles.activeBar} />}
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={selected ? theme.colors.accent : theme.colors.textMuted}
                  />
                  <Text style={[styles.menuLabel, selected && styles.menuLabelActive]}>
                    {item.label}
                  </Text>
                  {item.id === "all_files" && (
                    <Ionicons name="chevron-down" size={14} color={theme.colors.textMuted} />
                  )}
                </Pressable>
              );
            })}
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
    width: "82%",
    maxWidth: 320,
    backgroundColor: theme.colors.surface,
    height: "100%",
  },
  header: { padding: 20, paddingTop: 56 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  profileMeta: { flex: 1 },
  profileName: { color: "#fff", fontWeight: "600", fontSize: 16 },
  profileEmail: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
  menu: { flex: 1, paddingVertical: 8 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    position: "relative",
  },
  menuItemActive: { backgroundColor: theme.colors.infoBg },
  activeBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
  },
  menuLabel: { flex: 1, fontSize: 15, color: theme.colors.textMuted },
  menuLabelActive: { color: theme.colors.accent, fontWeight: "600" },
  logoutBtn: {
    margin: 20,
    backgroundColor: "#242424",
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
