/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Bottom-sheet style modal for requesting additional storage
 * from the Dashboard home screen.
 */

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { useUserQuota } from "@/src/hooks/useUserQuota";
import { useRouter } from "expo-router";
import { theme } from "@/src/constants/theme";

const SCREEN_HEIGHT = Dimensions.get("window").height;

const LEGEND: [string, string][] = [
  ["Images",    theme.colors.storageImages],
  ["Documents", theme.colors.storageDocs],
  ["Videos",    theme.colors.storageVideos],
  ["Others",    theme.colors.storageOther],
];

type DeltaOption = "+10 GB" | "+50 GB" | "+100 GB" | "+250 GB" | "Custom";

interface RequestStorageModalProps {
  visible: boolean;
  onClose: () => void;
}

export function RequestStorageModal({ visible, onClose }: RequestStorageModalProps) {
  const router = useRouter();
  const { data: userQuota } = useUserQuota();

  const [deltaSelection, setDeltaSelection] = useState<DeltaOption>("+100 GB");
  const [customAmount, setCustomAmount] = useState("150");

  const usedBytes = userQuota?.quota?.used ?? 0;
  const totalBytes = userQuota?.quota?.total ?? 500 * 1024 * 1024 * 1024;
  const isUnlimited = totalBytes < 0;
  const usedGb = usedBytes / (1024 * 1024 * 1024);
  const totalGb = isUnlimited ? 0 : totalBytes / (1024 * 1024 * 1024);
  const usedPct = isUnlimited ? 0 : Math.min(Math.max((usedBytes / totalBytes) * 100, 0), 100);

  const imgW = Math.max(usedPct * 0.40, 0.05);
  const docW = Math.max(usedPct * 0.30, 0.05);
  const vidW = Math.max(usedPct * 0.20, 0.05);
  const othW = Math.max(usedPct * 0.10, 0.05);
  const emptyW = Math.max(100 - usedPct, 0.05);

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024 * 1024))} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
  };

  const usedDisplay = !isUnlimited && totalGb >= 1
    ? `${Math.round(usedGb)} GB`
    : formatSize(usedBytes);
  const totalDisplay = isUnlimited ? "Unlimited" : formatSize(totalBytes);

  const selectedAmount =
    deltaSelection === "Custom"
      ? parseInt(customAmount) || 0
      : parseInt(deltaSelection.replace("+", "").replace(" GB", "")) || 0;

  const handleRequestStorage = () => {
    if (selectedAmount <= 0) {
      return;
    }
    onClose();
    // Navigate to reason step with amount pre-filled
    router.push({
      pathname: "/request-storage" as any,
      params: { amount: String(selectedAmount), startStep: "reason" },
    });
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <Pressable style={styles.sheet} onPress={() => {}}>
            {/* Drag handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Title */}
              <Text style={styles.title}>Request More Storage</Text>
              <Text style={styles.subtitle}>
                Request additional storage from your admin.
              </Text>

              {/* Storage bar */}
              <View style={styles.storageBar}>
                <View style={[styles.barSeg, { flex: imgW, backgroundColor: theme.colors.storageImages, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }]} />
                <View style={[styles.barSeg, { flex: docW, backgroundColor: theme.colors.storageDocs }]} />
                <View style={[styles.barSeg, { flex: vidW, backgroundColor: theme.colors.storageVideos }]} />
                <View style={[styles.barSeg, { flex: othW, backgroundColor: theme.colors.storageOther }]} />
                {emptyW > 0 && (
                  <View style={[styles.barSeg, { flex: emptyW, backgroundColor: theme.colors.storageEmpty, borderTopRightRadius: 4, borderBottomRightRadius: 4 }]} />
                )}
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                {LEGEND.map(([label, color]) => (
                  <View key={label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: color }]} />
                    <Text style={styles.legendText}>{label}</Text>
                  </View>
                ))}
              </View>

              {/* Delta pills */}
              <View style={styles.pillsRow}>
                {(["+10 GB", "+50 GB", "+100 GB", "+250 GB", "Custom"] as DeltaOption[]).map((opt) => {
                  const active = opt === deltaSelection;
                  return (
                    <Pressable
                      key={opt}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => setDeltaSelection(opt)}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Storage Amount */}
              <Text style={styles.fieldLabel}>Storage Amount</Text>
              <View style={styles.amountRow}>
                <TextInput
                  style={[styles.amountInput, deltaSelection !== "Custom" && styles.amountInputMuted]}
                  value={deltaSelection === "Custom" ? customAmount : String(selectedAmount)}
                  onChangeText={(text) => setCustomAmount(text.replace(/[^0-9]/g, ""))}
                  keyboardType="numeric"
                  editable={deltaSelection === "Custom"}
                />
                <Text style={styles.unitLabel}>GB</Text>
              </View>

              <Text style={styles.hintText}>
                Your request will be reviewed by the admin.
              </Text>

              {/* Request button */}
              <Pressable style={styles.requestBtn} onPress={handleRequestStorage}>
                <Text style={styles.requestBtnText}>Request storage</Text>
              </Pressable>

              {/* Cancel */}
              <Pressable style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  keyboardView: {
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.75,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 16,
  },
  storageBar: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "#eef0f4",
    marginBottom: 10,
  },
  barSeg: {},
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 10,
    color: "#9ca3af",
    fontWeight: "500",
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  pillActive: {
    backgroundColor: "#5a3cf4",
    borderColor: "#5a3cf4",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a2e",
  },
  pillTextActive: {
    color: "#ffffff",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#5a3cf4",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a2e",
  },
  amountInputMuted: {
    color: "#9ca3af",
  },
  unitLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#9ca3af",
  },
  hintText: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 20,
  },
  requestBtn: {
    backgroundColor: "#5a3cf4",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#4e3cf4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  requestBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
