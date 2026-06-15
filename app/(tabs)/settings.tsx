/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useEffect, useState, type ReactNode } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/stores/authStore";
import { brand } from "@/src/constants/brand";
import { theme } from "@/src/constants/theme";
import {
  isAutoUploadEnabled,
  setAutoUploadEnabled,
  scanAndQueueNewPhotos,
} from "@/src/sync/autoUpload";

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  trailing?: ReactNode;
  destructive?: boolean;
}

function SettingsRow({ icon, label, onPress, trailing, destructive }: SettingsRowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress && !trailing}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={destructive ? "#dc2626" : theme.colors.accent} />
      </View>
      <Text style={[styles.rowLabel, destructive && styles.destructive]}>{label}</Text>
      {trailing ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} /> : null)}
    </Pressable>
  );
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const {
    serverUrl,
    username,
    displayName,
    biometricEnabled,
    logout,
    setBiometricEnabled,
  } = useAuthStore();
  const [bioLoading, setBioLoading] = useState(false);
  const [autoUpload, setAutoUpload] = useState(false);

  useEffect(() => {
    isAutoUploadEnabled().then(setAutoUpload).catch(() => undefined);
  }, []);

  const toggleBiometric = async (value: boolean) => {
    setBioLoading(true);
    try {
      if (value) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !enrolled) {
          Alert.alert("Biometrics unavailable");
          return;
        }
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Enable app lock",
        });
        if (!result.success) return;
      }
      await setBiometricEnabled(value);
    } finally {
      setBioLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{displayName || username}</Text>
            <Text style={styles.profileServer}>{serverUrl.replace(/^https?:\/\//, "")}</Text>
          </View>
        </View>

        <SettingsGroup title="Account">
          <SettingsRow icon="person-outline" label="Profile" onPress={() => Alert.alert("Profile", "Coming soon")} />
          <SettingsRow icon="cloud-upload-outline" label="Upload" onPress={() => router.push("/(tabs)/shared")} />
          <SettingsRow icon="help-circle-outline" label="Help" onPress={() => Linking.openURL(brand.helpUrl)} />
        </SettingsGroup>

        <SettingsGroup title="Sync & Storage">
          <SettingsRow
            icon="cloud-outline"
            label="Auto-upload photos"
            trailing={
              <Switch
                value={autoUpload}
                onValueChange={async (value) => {
                  await setAutoUploadEnabled(value);
                  setAutoUpload(value);
                  if (value) await scanAndQueueNewPhotos();
                }}
                trackColor={{ true: theme.colors.accent }}
              />
            }
          />
          <SettingsRow icon="shield-checkmark-outline" label="Security" onPress={() => Alert.alert("Security", "Server uses SSL when configured.")} />
          <SettingsRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() => Alert.alert("Notifications", "Push notifications are disabled in this build.")}
          />
          <SettingsRow icon="extension-puzzle-outline" label="Connect Extension" onPress={() => Alert.alert("Extension", "Desktop sync extension coming soon.")} />
        </SettingsGroup>

        <SettingsGroup title="Security">
          <SettingsRow
            icon="finger-print-outline"
            label="Biometric lock"
            trailing={
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometric}
                disabled={bioLoading}
                trackColor={{ true: theme.colors.accent }}
              />
            }
          />
          <SettingsRow icon="key-outline" label="Passcode" onPress={() => Alert.alert("Passcode", "Use biometric lock for now.")} />
        </SettingsGroup>

        <SettingsGroup title="About">
          <SettingsRow icon="information-circle-outline" label="About Karsaaz Sync" onPress={() => Linking.openURL(brand.legalUrl)} />
          <SettingsRow icon="document-text-outline" label="Legal & Privacy" onPress={() => Linking.openURL(brand.legalUrl)} />
        </SettingsGroup>

        <Pressable
          style={styles.logoutBtn}
          onPress={async () => {
            await logout();
            router.replace("/(auth)/login");
          }}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <Pressable style={styles.deleteBtn} onPress={() => Alert.alert("Delete Account", "Contact your administrator.")}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: theme.colors.text },
  content: { padding: theme.spacing.screen, paddingBottom: 120 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 24,
    ...theme.shadow.card,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.infoBg,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: { fontSize: 20, fontWeight: "700", color: theme.colors.accent },
  profileMeta: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: "600", color: theme.colors.text },
  profileServer: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  group: { marginBottom: 20 },
  groupTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMuted,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    ...theme.shadow.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderLight,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.infoBg,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: 15, color: theme.colors.text },
  destructive: { color: "#dc2626" },
  logoutBtn: {
    marginTop: 8,
    backgroundColor: "#242424",
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  deleteBtn: { marginTop: 16, alignItems: "center", paddingVertical: 12 },
  deleteText: { color: "#dc2626", fontSize: 14, fontWeight: "500" },
});
