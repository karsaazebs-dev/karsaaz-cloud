/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUserQuota } from "@/src/hooks/useUserQuota";
import { useFiles } from "@/src/hooks/useFiles";
import { useStorageRequestStore } from "@/src/stores/storageRequestStore";
import { theme } from "@/src/constants/theme";
import { formatFileSize, formatRelativeDate } from "@/src/utils/fileFilters";
import { BackButton } from "@/src/components/ui/BackButton";

export default function ManageStorageScreen() {
  const router = useRouter();
  const { data: userQuota, refetch: refetchQuota, isLoading: quotaLoading } = useUserQuota();
  const { data: files, deleteMutation, refetch: refetchFiles, isLoading: filesLoading } = useFiles("/");
  
  const requests = useStorageRequestStore((s) => s.requests);
  const hydrateRequests = useStorageRequestStore((s) => s.hydrate);

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  useEffect(() => {
    hydrateRequests();
  }, [hydrateRequests]);

  // Quota dimensions
  const usedBytes = userQuota?.quota?.used ?? 0;
  const totalBytes = userQuota?.quota?.total ?? 500 * 1024 * 1024 * 1024;
  const isUnlimited = totalBytes < 0;
  const percentage = isUnlimited ? 0 : Math.round((usedBytes / totalBytes) * 100);

  // Large files (files over 1MB sorted by size desc)
  const largeFiles = (files ?? [])
    .filter((f) => f.type === "file")
    .sort((a, b) => b.size - a.size)
    .slice(0, 5);

  const toggleSelect = (path: string) => {
    setSelectedFiles((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const deleteSelected = () => {
    if (selectedFiles.length === 0) return;
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete the ${selectedFiles.length} selected file(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            for (const path of selectedFiles) {
              const fileObj = files?.find((f) => f.path === path);
              if (fileObj) {
                await deleteMutation.mutateAsync(fileObj);
              }
            }
            setSelectedFiles([]);
            refetchQuota();
            refetchFiles();
            Alert.alert("Success", "Selected files have been deleted.");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Manage Storage</Text>
        <Pressable onPress={() => { refetchQuota(); refetchFiles(); }} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Storage card summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Storage Overview</Text>
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.usedText}>{formatFileSize(usedBytes)}</Text>
              <Text style={styles.totalText}>
                used of {isUnlimited ? "Unlimited" : formatFileSize(totalBytes)}
              </Text>
            </View>
            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>{percentage}%</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(percentage, 100)}%` }]} />
          </View>
        </View>

        {/* Storage Request Actions */}
        <View style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.accent} />
            <View style={styles.actionHeaderText}>
              <Text style={styles.actionTitle}>Need more space?</Text>
              <Text style={styles.actionSubtitle}>
                Submit a request to the system administrator to upgrade your storage allocation.
              </Text>
            </View>
          </View>
          <Pressable
            style={styles.requestBtn}
            onPress={() => router.push("/request-storage")}
          >
            <Text style={styles.requestBtnText}>Request Storage Upgrade</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </Pressable>
        </View>

        {/* Clean up section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Clean Up Storage</Text>
            <Text style={styles.sectionSubtitle}>Select and remove largest files to free up space</Text>
          </View>

          {filesLoading || quotaLoading ? (
            <ActivityIndicator style={styles.loader} color={theme.colors.accent} />
          ) : largeFiles.length === 0 ? (
            <Text style={styles.emptyText}>No large files found to clean up.</Text>
          ) : (
            <View style={styles.fileList}>
              {largeFiles.map((file) => {
                const selected = selectedFiles.includes(file.path);
                return (
                  <Pressable
                    key={file.path}
                    style={[styles.fileRow, selected && styles.fileRowSelected]}
                    onPress={() => toggleSelect(file.path)}
                  >
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <View style={styles.fileMeta}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text style={styles.fileDate}>
                        {formatFileSize(file.size)} · {formatRelativeDate(file.lastModified)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}

              {selectedFiles.length > 0 && (
                <Pressable style={styles.deleteBtn} onPress={deleteSelected}>
                  <Ionicons name="trash" size={18} color="#fff" />
                  <Text style={styles.deleteBtnText}>
                    Delete Selected ({selectedFiles.length})
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* Recent Requests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Upgrade Requests</Text>
            <Text style={styles.sectionSubtitle}>History of your storage requests</Text>
          </View>

          {requests.length === 0 ? (
            <Text style={styles.emptyText}>No previous storage upgrade requests.</Text>
          ) : (
            <View style={styles.requestsList}>
              {requests.map((req) => (
                <View key={req.id} style={styles.requestRow}>
                  <View style={styles.requestMeta}>
                    <Text style={styles.requestSizes}>
                      {req.currentSize} → {req.requestedSize}
                    </Text>
                    <Text style={styles.requestReason} numberOfLines={2}>
                      "{req.reason}"
                    </Text>
                    <Text style={styles.requestDate}>
                      {new Date(req.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      req.status === "Approved" && styles.statusBadgeApproved,
                      req.status === "Rejected" && styles.statusBadgeRejected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        req.status === "Approved" && styles.statusTextApproved,
                        req.status === "Rejected" && styles.statusTextRejected,
                      ]}
                    >
                      {req.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: theme.colors.text },
  refreshBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  scroll: { padding: theme.spacing.screen, gap: 24 },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.card,
    ...theme.shadow.card,
  },
  cardTitle: { fontSize: 14, color: theme.colors.textMuted, marginBottom: 8 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  usedText: { fontSize: 28, fontWeight: "700", color: theme.colors.textDark },
  totalText: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
  percentBadge: {
    backgroundColor: theme.colors.infoBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
  },
  percentText: { fontSize: 16, fontWeight: "600", color: theme.colors.accent },
  progressBar: { height: 8, backgroundColor: theme.colors.borderLight, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: theme.colors.accent },
  actionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.card,
    gap: 16,
    ...theme.shadow.card,
  },
  actionHeader: { flexDirection: "row", gap: 14 },
  actionHeaderText: { flex: 1, gap: 4 },
  actionTitle: { fontSize: 16, fontWeight: "600", color: theme.colors.textDark },
  actionSubtitle: { fontSize: 13, color: theme.colors.textMuted, lineHeight: 18 },
  requestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
  },
  requestBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  section: { gap: 12 },
  sectionHeader: { gap: 4, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: theme.colors.textDark },
  sectionSubtitle: { fontSize: 13, color: theme.colors.textMuted },
  fileList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 8,
    ...theme.shadow.card,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: theme.radius.md,
  },
  fileRowSelected: { backgroundColor: theme.colors.infoBg },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  fileMeta: { flex: 1, gap: 2 },
  fileName: { fontSize: 14, fontWeight: "500", color: theme.colors.text },
  fileDate: { fontSize: 12, color: theme.colors.textMuted },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#dc2626",
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    margin: 8,
  },
  deleteBtnText: { color: "#fff", fontWeight: "600" },
  loader: { paddingVertical: 24 },
  emptyText: { color: theme.colors.textMuted, paddingHorizontal: 4, fontStyle: "italic" },
  requestsList: { gap: 12 },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    ...theme.shadow.card,
  },
  requestMeta: { flex: 1, gap: 4 },
  requestSizes: { fontSize: 14, fontWeight: "600", color: theme.colors.textDark },
  requestReason: { fontSize: 12, color: theme.colors.textSecondary },
  requestDate: { fontSize: 11, color: theme.colors.textMuted },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: "rgba(234, 179, 8, 0.1)", // Yellow for Pending
  },
  statusBadgeApproved: { backgroundColor: "rgba(16, 185, 129, 0.1)" },
  statusBadgeRejected: { backgroundColor: "rgba(220, 38, 38, 0.1)" },
  statusText: { fontSize: 12, fontWeight: "600", color: "rgb(202, 138, 4)" },
  statusTextApproved: { color: theme.colors.success },
  statusTextRejected: { color: "#dc2626" },
}));
