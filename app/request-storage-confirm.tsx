/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:6551 — Request Storage submitted confirmation
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function RequestStorageConfirmScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <View style={styles.illustration}>
          <View style={styles.iconRing}>
            <Ionicons name="checkmark" size={48} color="#ffffff" />
          </View>
        </View>

        <Text style={styles.title}>Request Submitted!</Text>
        <Text style={styles.description}>
          Your storage request has been sent to your admin. You'll be notified once it is reviewed.
        </Text>

        <View style={styles.badge}>
          <Ionicons name="time-outline" size={16} color="#ca8a04" />
          <Text style={styles.badgeText}>Pending Approval</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.replace("/(tabs)/index" as any)}
        >
          <Text style={styles.primaryBtnText}>Done</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => router.push("/request-storage-history" as any)}
        >
          <Text style={styles.secondaryBtnText}>View Request History</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7f7f7", justifyContent: "space-between" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  illustration: { marginBottom: 8 },
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4e3cf4",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4e3cf4",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: { fontSize: 26, fontWeight: "700", color: "#09090b", textAlign: "center" },
  description: {
    fontSize: 15,
    color: "#71717b",
    textAlign: "center",
    lineHeight: 22,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(234,179,8,0.1)",
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: { fontSize: 13, fontWeight: "600", color: "#a16207" },
  footer: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },
  primaryBtn: {
    backgroundColor: "#4e3cf4",
    borderRadius: 14,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4e3cf4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  secondaryBtn: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dfe1e4",
    backgroundColor: "#ffffff",
  },
  secondaryBtnText: { color: "#4e3cf4", fontSize: 15, fontWeight: "500" },
});
