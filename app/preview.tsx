/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { View, Text, Image, StyleSheet, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { useAuthStore } from "@/src/stores/authStore";
import { getFileDownloadUrl } from "@karsaaz/cloud-api";
import { brand } from "@/src/constants/brand";
import { theme } from "@/src/constants/theme";

export default function PreviewScreen() {
  const router = useRouter();
  const { path, name, mime } = useLocalSearchParams<{
    path: string;
    name: string;
    mime: string;
  }>();
  const { username, serverUrl, basicAuth } = useAuthStore();

  const relPath = (path ?? "").replace(`/files/${username}`, "");
  const downloadUrl = getFileDownloadUrl(serverUrl, username, relPath);
  const isImage = (mime ?? "").startsWith("image/");

  const shareLocal = async () => {
    const dest = `${FileSystem.cacheDirectory}${name}`;
    const result = await FileSystem.downloadAsync(downloadUrl, dest, {
      headers: { Authorization: `Basic ${basicAuth}` },
    });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(result.uri);
    }
  };

  const openOffice = () => {
    Linking.openURL(`${serverUrl}/apps/files/?dir=/${encodeURIComponent(name ?? "")}`);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
        <View style={styles.closeBtn} />
      </View>

      <View style={styles.previewArea}>
        {isImage ? (
          <Image
            source={{ uri: downloadUrl, headers: { Authorization: `Basic ${basicAuth}` } }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.filePlaceholder}>
            <Ionicons name="document-outline" size={64} color={theme.colors.accent} />
            <Text style={styles.meta}>{mime}</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.btn} onPress={shareLocal}>
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={styles.btnText}>Download / Share</Text>
        </Pressable>
        <Pressable style={styles.btnSecondary} onPress={openOffice}>
          <Ionicons name="open-outline" size={20} color={theme.colors.accent} />
          <Text style={styles.btnSecondaryText}>Open in {brand.serverProductName}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "600", color: theme.colors.text, textAlign: "center" },
  previewArea: { flex: 1, backgroundColor: theme.colors.background },
  image: { flex: 1 },
  filePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  meta: { color: theme.colors.textMuted },
  actions: { gap: 10, padding: theme.spacing.screen },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    padding: 14,
  },
  btnText: { color: "#fff", fontWeight: "600" },
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.radius.md,
    padding: 14,
    backgroundColor: theme.colors.surface,
  },
  btnSecondaryText: { color: theme.colors.accent, fontWeight: "600" },
});
