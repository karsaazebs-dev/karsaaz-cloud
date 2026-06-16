/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:6597 — Not Enough Storage full-screen warning
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

interface NotEnoughStorageScreenProps {
  onDismiss?: () => void;
}

export function NotEnoughStorageScreen({ onDismiss }: NotEnoughStorageScreenProps) {
  const router = useRouter();

  const handleRequestMore = () => {
    onDismiss?.();
    router.push("/request-storage" as any);
  };

  const handleCleanUp = () => {
    onDismiss?.();
    router.push("/manage-storage" as any);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <View style={styles.illustration}>
          <View style={styles.cloudWrap}>
            <Ionicons name="cloud-outline" size={80} color="#dfe1e4" />
            <View style={styles.exclamationBadge}>
              <Ionicons name="alert" size={20} color="#ffffff" />
            </View>
          </View>
        </View>

        <Text style={styles.title}>Not Enough Storage</Text>
        <Text style={styles.description}>
          Your storage is full. You won't be able to upload or sync new files until you free up space or request an upgrade.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primaryBtn} onPress={handleRequestMore}>
          <Ionicons name="cloud-upload-outline" size={20} color="#ffffff" />
          <Text style={styles.primaryBtnText}>Request More</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={handleCleanUp}>
          <Ionicons name="trash-outline" size={20} color="#4e3cf4" />
          <Text style={styles.secondaryBtnText}>Clean Up</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  illustration: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cloudWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  exclamationBadge: {
    position: "absolute",
    bottom: 0,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#f7f7f7",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#09090b",
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#71717b",
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#4e3cf4",
    borderRadius: 14,
    height: 56,
    shadowColor: "#4e3cf4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    height: 56,
    borderWidth: 1,
    borderColor: "#dfe1e4",
  },
  secondaryBtnText: { color: "#4e3cf4", fontSize: 16, fontWeight: "600" },
});
