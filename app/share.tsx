/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  Share as RNShare,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSharing } from "@/src/hooks/useSharing";
import { theme } from "@/src/constants/theme";

export default function ShareScreen() {
  const router = useRouter();
  const { path, name } = useLocalSearchParams<{ path: string; name: string }>();
  const { sharesQuery, createMutation, deleteMutation } = useSharing(path);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  const existingLink = sharesQuery.data?.find((s) => s.share_type === 3);

  const createPublicLink = () => {
    createMutation.mutate(
      { path: path ?? "/", shareType: 3, permissions: 1 },
      {
        onSuccess: (share) => {
          const url = share.url ?? null;
          setCreatedUrl(url);
          if (url) Alert.alert("Link created", "You can copy or share the link below.");
        },
        onError: (e) => Alert.alert("Error", String(e)),
      }
    );
  };

  const linkUrl = createdUrl ?? existingLink?.url ?? null;

  const shareLink = async () => {
    if (!linkUrl) return;
    await RNShare.share({ message: linkUrl, url: linkUrl });
  };

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Share</Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.fileCard}>
          <View style={styles.fileIcon}>
            <Ionicons name="document-outline" size={28} color={theme.colors.accent} />
          </View>
          <Text style={styles.fileName} numberOfLines={2}>{name}</Text>
        </View>

        <Text style={styles.sectionLabel}>Public link</Text>
        <View style={styles.linkCard}>
          {linkUrl ? (
            <Text style={styles.linkText} numberOfLines={2}>{linkUrl}</Text>
          ) : (
            <Text style={styles.linkPlaceholder}>No public link yet</Text>
          )}
        </View>

        <Pressable
          style={[styles.primaryBtn, createMutation.isPending && styles.btnDisabled]}
          onPress={createPublicLink}
          disabled={createMutation.isPending}
        >
          <Ionicons name="link-outline" size={20} color="#fff" />
          <Text style={styles.primaryBtnText}>
            {linkUrl ? "Regenerate link" : "Create public link"}
          </Text>
        </Pressable>

        {linkUrl && (
          <Pressable style={styles.secondaryBtn} onPress={shareLink}>
            <Ionicons name="share-social-outline" size={18} color={theme.colors.accent} />
            <Text style={styles.secondaryBtnText}>Share link</Text>
          </Pressable>
        )}

        {existingLink && (
          <Pressable
            style={styles.destructiveBtn}
            onPress={() => {
              Alert.alert("Remove link", "Remove this public share?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Remove",
                  style: "destructive",
                  onPress: () => deleteMutation.mutate(existingLink.id),
                },
              ]);
            }}
          >
            <Text style={styles.destructiveText}>Remove public link</Text>
          </Pressable>
        )}
      </ScrollView>
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
  headerTitle: { fontSize: 18, fontWeight: "600", color: theme.colors.text },
  content: { padding: theme.spacing.screen, gap: 16 },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.lg,
    padding: 16,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.infoBg,
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: { flex: 1, fontSize: 16, fontWeight: "600", color: theme.colors.text },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: theme.colors.textMuted },
  linkCard: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.md,
    padding: 14,
    minHeight: 48,
  },
  linkText: { fontSize: 13, color: theme.colors.link },
  linkPlaceholder: { fontSize: 13, color: theme.colors.textMuted },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
  },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
  },
  secondaryBtnText: { color: theme.colors.accent, fontWeight: "600", fontSize: 14 },
  destructiveBtn: { alignItems: "center", paddingVertical: 12 },
  destructiveText: { color: "#dc2626", fontSize: 14, fontWeight: "500" },
});
