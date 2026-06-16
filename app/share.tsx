/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma nodes 1:4145 (Internal Share), 1:4531 (External Share), 1:4916 (Activity)
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
  { id: "internal", label: "Internal" },
  { id: "external", label: "External" },
  { id: "activity", label: "Activity" },
];

const PERMISSIONS = [
  { label: "View", value: 1 },
  { label: "Edit", value: 31 },
];

// ─── Internal Share Tab ───────────────────────────────────────────────────────

function InternalShareTab({ path }: { path?: string }) {
  const [username, setUsername] = useState("");
  const [permission, setPermission] = useState(1);
  const { createMutation } = useSharing(path);

  const handleShare = () => {
    if (!path || !username.trim()) return;
    createMutation.mutate(
      { path, shareType: 0, permissions: permission },
      {
        onSuccess: () => {
          Alert.alert("Shared", `"${path.split("/").pop()}" shared with ${username}`);
          setUsername("");
        },
        onError: (e) => Alert.alert("Error", String(e)),
      }
    );
  };

  if (!path) {
    return (
      <View style={styles.placeholder}>
        <Ionicons name="person-add-outline" size={40} color="#d4d4d8" />
        <Text style={styles.placeholderText}>Open a file to share it internally</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <Text style={styles.label}>Share with user</Text>
      <View style={styles.inputWrap}>
        <Ionicons name="search-outline" size={18} color="#71717b" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Search by username or email"
          placeholderTextColor="#71717b"
          autoCapitalize="none"
        />
      </View>

      <Text style={styles.label}>Permission</Text>
      <View style={styles.permRow}>
        {PERMISSIONS.map((p) => (
          <Pressable
            key={p.value}
            style={[styles.permBtn, permission === p.value && styles.permBtnActive]}
            onPress={() => setPermission(p.value)}
          >
            <Text style={[styles.permText, permission === p.value && styles.permTextActive]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.primaryBtn, (!username.trim() || createMutation.isPending) && styles.disabled]}
        onPress={handleShare}
        disabled={!username.trim() || createMutation.isPending}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="person-add-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Share</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

// ─── External Share Tab ───────────────────────────────────────────────────────

function ExternalShareTab({ path }: { path?: string }) {
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const { sharesQuery, createMutation, deleteMutation } = useSharing(path);

  const existingLink = (sharesQuery.data as any[])?.find((s: any) => s.share_type === 3);
  const linkUrl = createdUrl ?? existingLink?.url ?? null;

  const handleCreate = () => {
    if (!path) return;
    createMutation.mutate(
      { path, shareType: 3, permissions: 1 },
      {
        onSuccess: (share: any) => setCreatedUrl(share.url ?? null),
        onError: (e) => Alert.alert("Error", String(e)),
      }
    );
  };

  const handleCopy = async () => {
    if (!linkUrl) return;
    await RNShare.share({ message: linkUrl });
  };

  const handleNativeShare = async () => {
    if (!linkUrl) return;
    await RNShare.share({ message: linkUrl, url: linkUrl });
  };

  if (!path) {
    return (
      <View style={styles.placeholder}>
        <Ionicons name="link-outline" size={40} color="#d4d4d8" />
        <Text style={styles.placeholderText}>Open a file to generate a public link</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <Text style={styles.label}>Public link</Text>
      <View style={styles.linkCard}>
        {linkUrl ? (
          <Text style={styles.linkText} numberOfLines={3}>{linkUrl}</Text>
        ) : (
          <Text style={styles.linkPlaceholder}>No public link yet</Text>
        )}
      </View>

      {linkUrl && (
        <View style={styles.linkActions}>
          <Pressable style={styles.iconActionBtn} onPress={handleCopy}>
            <Ionicons name="copy-outline" size={20} color={theme.colors.accent} />
            <Text style={styles.iconActionText}>Copy</Text>
          </Pressable>
          <Pressable style={styles.iconActionBtn} onPress={handleNativeShare}>
            <Ionicons name="share-social-outline" size={20} color={theme.colors.accent} />
            <Text style={styles.iconActionText}>Share</Text>
          </Pressable>
        </View>
      )}

      <Pressable
        style={[styles.primaryBtn, createMutation.isPending && styles.disabled]}
        onPress={handleCreate}
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="link-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>
              {linkUrl ? "Regenerate link" : "Create public link"}
            </Text>
          </>
        )}
      </Pressable>

      {existingLink && (
        <Pressable
          style={styles.destructiveBtn}
          onPress={() =>
            Alert.alert("Remove link", "Remove this public share?", [
              { text: "Cancel", style: "cancel" },
              { text: "Remove", style: "destructive", onPress: () => deleteMutation.mutate(existingLink.id) },
            ])
          }
        >
          <Text style={styles.destructiveText}>Remove public link</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────

function ActivityTab() {
  const { data, isLoading } = useActivity();
  const events = (data as any[]) ?? [];

  if (isLoading) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.placeholder}>
        <Ionicons name="time-outline" size={40} color="#d4d4d8" />
        <Text style={styles.placeholderText}>No activity yet</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.activityList}>
      {events.map((event: any, i: number) => (
        <View key={event.activity_id ?? i} style={styles.eventRow}>
          <View style={styles.eventDot} />
          <View style={styles.eventBody}>
            <Text style={styles.eventSubject} numberOfLines={1}>
              {event.subject ?? event.type ?? "Event"}
            </Text>
            <Text style={styles.eventTime}>
              {event.datetime
                ? new Date(event.datetime).toLocaleString()
                : ""}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Root Screen ──────────────────────────────────────────────────────────────

export default function ShareScreen() {
  const router = useRouter();
  const { path, name } = useLocalSearchParams<{ path?: string; name?: string }>();
  const [activeTab, setActiveTab] = useState<Tab>(path ? "internal" : "activity");

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#09090b" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {name ? name : "Share & Activity"}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === "internal" && <InternalShareTab path={path} />}
      {activeTab === "external" && <ExternalShareTab path={path} />}
      {activeTab === "activity" && <ActivityTab />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7f7f7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#f7f7f7",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "500", color: "#09090b" },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 4,
    borderWidth: 0.5,
    borderColor: "#dfe1e4",
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  tabItemActive: { backgroundColor: "#4e3cf4" },
  tabLabel: { fontSize: 14, fontWeight: "500", color: "#71717b" },
  tabLabelActive: { color: "#ffffff" },
  tabContent: { padding: 24, gap: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#71717b", marginBottom: -8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 0.5,
    borderColor: "#dfe1e4",
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#09090b" },
  permRow: { flexDirection: "row", gap: 12 },
  permBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dfe1e4",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  permBtnActive: { backgroundColor: "#4e3cf4", borderColor: "#4e3cf4" },
  permText: { fontSize: 15, fontWeight: "500", color: "#71717b" },
  permTextActive: { color: "#ffffff" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4e3cf4",
    borderRadius: 12,
    height: 52,
    marginTop: 8,
  },
  primaryBtnText: { color: "#ffffff", fontWeight: "600", fontSize: 16 },
  disabled: { opacity: 0.5 },
  linkCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    minHeight: 52,
    borderWidth: 0.5,
    borderColor: "#dfe1e4",
  },
  linkText: { fontSize: 13, color: "#2b7fff" },
  linkPlaceholder: { fontSize: 13, color: "#71717b" },
  linkActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: -4,
  },
  iconActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dfe1e4",
    backgroundColor: "#ffffff",
  },
  iconActionText: { fontSize: 14, fontWeight: "500", color: "#4e3cf4" },
  destructiveBtn: { alignItems: "center", paddingVertical: 12 },
  destructiveText: { color: "#dc2626", fontSize: 14, fontWeight: "500" },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  placeholderText: { fontSize: 15, color: "#71717b", textAlign: "center" },
  activityList: { padding: 24, gap: 0 },
  eventRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#dfe1e4",
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4e3cf4",
    marginTop: 5,
    flexShrink: 0,
  },
  eventBody: { flex: 1 },
  eventSubject: { fontSize: 15, fontWeight: "500", color: "#09090b" },
  eventTime: { fontSize: 12, color: "#71717b", marginTop: 3 },
});
