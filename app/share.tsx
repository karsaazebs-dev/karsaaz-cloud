/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma nodes 1:4145 (Internal), 1:4531 (External), 1:4916 (Activity)
 */

import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
  Share as RNShare,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSharing } from "@/src/hooks/useSharing";
import { useActivity } from "@/src/hooks/useActivity";
import { theme } from "@/src/constants/theme";

type Tab = "internal" | "external" | "activity";

const TABS: { id: Tab; label: string }[] = [
  { id: "internal",  label: "Internal Share" },
  { id: "external",  label: "External Share" },
  { id: "activity",  label: "Activity" },
];

// ─── Internal Share Tab ───────────────────────────────────────────────────────

function InternalShareTab({ path, name }: { path?: string; name?: string }) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"View" | "Edit">("View");
  const { createMutation } = useSharing(path);

  const handleShare = () => {
    if (!path || !email.trim()) return;
    createMutation.mutate(
      { path, shareType: 0, permissions: permission === "Edit" ? 31 : 1 },
      {
        onSuccess: () => {
          Alert.alert("Shared", `Shared with ${email}`);
          setEmail("");
        },
        onError: (e) => Alert.alert("Error", String(e)),
      }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.tabContent} keyboardShouldPersistTaps="handled">
      <View style={styles.permRow}>
        <Text style={styles.permLabel}>What person can do</Text>
        <Pressable
          style={styles.permDropdown}
          onPress={() => setPermission((p) => (p === "View" ? "Edit" : "View"))}
        >
          <Text style={styles.permDropdownText}>{permission}</Text>
          <Ionicons name="chevron-down" size={14} color={theme.colors.accentBright} />
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>Email</Text>
      <View style={styles.inputRow}>
        <Ionicons name="person-outline" size={18} color={theme.colors.accentBright} />
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="yourname@company.io"
          placeholderTextColor="#71717b"
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.linkSection}>
        <Text style={styles.linkSectionTitle}>Internal Link</Text>
        <Pressable onPress={() => path && RNShare.share({ message: path })}>
          <Text style={styles.copyLinkBtn}>Copy Link</Text>
        </Pressable>
      </View>
      <Text style={styles.linkHint}>Only works for people with access to this file</Text>

      <Pressable
        style={[styles.shareBtn, (!email.trim() || createMutation.isPending) && styles.disabled]}
        onPress={handleShare}
        disabled={!email.trim() || createMutation.isPending}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.shareBtnText}>Share</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

// ─── External Share Tab ───────────────────────────────────────────────────────

function ExternalShareTab({ path }: { path?: string }) {
  const [email, setEmail] = useState("");
  const { sharesQuery, createMutation, deleteMutation } = useSharing(path);
  const existingLink = (sharesQuery.data as any[])?.find((s: any) => s.share_type === 3);
  const linkUrl = existingLink?.url ?? null;

  const handleCreate = () => {
    if (!path) return;
    createMutation.mutate(
      { path, shareType: 3, permissions: 1 },
      { onError: (e) => Alert.alert("Error", String(e)) }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.tabContent} keyboardShouldPersistTaps="handled">
      <View style={styles.permRow}>
        <Text style={styles.permLabel}>What person can do</Text>
        <Pressable style={styles.permDropdown}>
          <Text style={styles.permDropdownText}>View</Text>
          <Ionicons name="chevron-down" size={14} color={theme.colors.accentBright} />
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>Email</Text>
      <View style={styles.inputRow}>
        <Ionicons name="person-outline" size={18} color={theme.colors.accentBright} />
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="yourname@company.io"
          placeholderTextColor="#71717b"
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.linkSection}>
        <Text style={styles.linkSectionTitle}>External Link</Text>
        {linkUrl ? (
          <Pressable onPress={() => RNShare.share({ message: linkUrl, url: linkUrl })}>
            <Text style={styles.copyLinkBtn}>Copy Link</Text>
          </Pressable>
        ) : (
          <Pressable onPress={handleCreate} disabled={createMutation.isPending}>
            <Text style={styles.copyLinkBtn}>
              {createMutation.isPending ? "Creating..." : "Create Link"}
            </Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.linkHint}>Only works for people with access to this file</Text>

      {existingLink && (
        <Pressable
          style={styles.removeLinkBtn}
          onPress={() =>
            Alert.alert("Remove link", "Remove this public share?", [
              { text: "Cancel", style: "cancel" },
              { text: "Remove", style: "destructive", onPress: () => deleteMutation.mutate(existingLink.id) },
            ])
          }
        >
          <Text style={styles.removeLinkText}>Remove public link</Text>
        </Pressable>
      )}

      <Pressable style={[styles.shareBtn, !email.trim() && styles.disabled]} disabled={!email.trim()}>
        <Text style={styles.shareBtnText}>Share</Text>
      </Pressable>
    </ScrollView>
  );
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────

function ActivityTab({ name }: { name?: string }) {
  const { data, isLoading } = useActivity();
  const events = (data as any[]) ?? [];
  const [comment, setComment] = useState("");

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.activityWrap}>
      <ScrollView contentContainerStyle={styles.activityList}>
        {events.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="time-outline" size={40} color="#d4d4d8" />
            <Text style={styles.emptyText}>No activity yet</Text>
          </View>
        ) : (
          events.map((event: any, i: number) => (
            <View key={event.activity_id ?? i} style={styles.activityItem}>
              <View style={styles.activityThumb}>
                <Ionicons name="document-text-outline" size={20} color="#ca8a04" />
              </View>
              <View style={styles.activityBody}>
                <Text style={styles.activityTitle} numberOfLines={1}>
                  {event.subject ?? event.type ?? "Activity"}
                </Text>
                <Text style={styles.activityMeta}>
                  {event.datetime ? new Date(event.datetime).toLocaleDateString() : ""}
                </Text>
              </View>
              <Ionicons name="ellipsis-horizontal" size={16} color="#71717b" />
            </View>
          ))
        )}
      </ScrollView>
      <View style={styles.commentBar}>
        <View style={styles.commentAvatar}>
          <Text style={styles.commentAvatarText}>A</Text>
        </View>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder="New comment"
          placeholderTextColor="#71717b"
        />
        <Pressable hitSlop={8}>
          <Ionicons name="send" size={20} color={theme.colors.accent} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Root Screen ──────────────────────────────────────────────────────────────

export default function ShareScreen() {
  const router = useRouter();
  const { path, name } = useLocalSearchParams<{ path?: string; name?: string }>();
  const [activeTab, setActiveTab] = useState<Tab>(path ? "internal" : "activity");
  const fileName = name ?? path?.split("/").pop() ?? "File";

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      {/* Header area */}
      <View style={styles.headerArea}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {fileName}
          </Text>
          <Pressable style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color="#09090b" />
          </Pressable>
        </View>
        {path && (
          <View style={styles.fileInfoRow}>
            <View style={styles.fileThumb}>
              <Ionicons name="document-outline" size={20} color="#71717b" />
            </View>
            <View style={styles.fileInfoText}>
              <Text style={styles.fileInfoName} numberOfLines={1}>{fileName}</Text>
              <Text style={styles.fileInfoMeta}>Owner</Text>
            </View>
            <Ionicons name="ellipsis-horizontal" size={18} color="#71717b" />
            <Ionicons name="close-outline" size={18} color="#71717b" />
          </View>
        )}
      </View>

      {/* Underline tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {activeTab === tab.id && <View style={styles.tabUnderline} />}
          </Pressable>
        ))}
      </View>

      {activeTab === "internal"  && <InternalShareTab path={path} name={name} />}
      {activeTab === "external"  && <ExternalShareTab path={path} />}
      {activeTab === "activity"  && <ActivityTab name={name} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ffffff" },

  headerArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#dfe1e4",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#09090b", flex: 1, marginRight: 12 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  fileInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    padding: 10,
  },
  fileThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  fileInfoText: { flex: 1 },
  fileInfoName: { fontSize: 13, fontWeight: "600", color: "#09090b" },
  fileInfoMeta: { fontSize: 11, color: "#71717b", marginTop: 2 },

  // Underline tab bar
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#dfe1e4",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    position: "relative",
  },
  tabLabel: { fontSize: 13, fontWeight: "500", color: "#71717b" },
  tabLabelActive: { color: theme.colors.accentBright, fontWeight: "600" },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.accentBright,
    borderRadius: 1,
  },

  // Shared tab content
  tabContent: { padding: 20, gap: 16, paddingBottom: 32 },

  permRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  permLabel: { fontSize: 14, color: "#09090b", fontWeight: "500" },
  permDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  permDropdownText: { fontSize: 14, color: theme.colors.accentBright, fontWeight: "500" },

  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#09090b", marginBottom: -8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f7f8ff",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: "#dfe1e4",
  },
  input: { flex: 1, fontSize: 14, color: "#09090b" },

  linkSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  linkSectionTitle: { fontSize: 15, fontWeight: "600", color: "#09090b" },
  copyLinkBtn: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.accentBright,
    borderWidth: 1,
    borderColor: theme.colors.accentBright,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  linkHint: { fontSize: 12, color: "#71717b", marginTop: -8 },

  removeLinkBtn: { alignItems: "center", paddingVertical: 8 },
  removeLinkText: { color: "#dc2626", fontSize: 13, fontWeight: "500" },

  shareBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  shareBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.4 },

  // Activity
  activityWrap: { flex: 1 },
  activityList: { padding: 20, gap: 0, paddingBottom: 80 },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  activityThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#fef9c3",
    alignItems: "center",
    justifyContent: "center",
  },
  activityBody: { flex: 1 },
  activityTitle: { fontSize: 13, fontWeight: "500", color: "#09090b" },
  activityMeta: { fontSize: 11, color: "#71717b", marginTop: 2 },

  commentBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#dfe1e4",
    backgroundColor: "#ffffff",
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e8e5fd",
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: { fontSize: 14, fontWeight: "600", color: "#4e3cf4" },
  commentInput: { flex: 1, fontSize: 14, color: "#09090b" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  emptyText: { fontSize: 14, color: "#71717b" },
});
