/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUserQuota } from "@/src/hooks/useUserQuota";
import { useStorageRequestStore } from "@/src/stores/storageRequestStore";
import { theme } from "@/src/constants/theme";
import { BackButton } from "@/src/components/ui/BackButton";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { formatFileSize } from "@/src/utils/fileFilters";

type Step = "reason" | "summary" | "success";

const SIZES = ["500 GB", "1 TB", "2 TB", "5 TB"];
const CATEGORIES = ["Project Work", "Personal Backups", "Database/Logs", "Shared Assets"];

export default function RequestStorageScreen() {
  const router = useRouter();
  const { data: userQuota, refetch: refetchQuota } = useUserQuota();
  const addRequest = useStorageRequestStore((s) => s.addRequest);

  const [step, setStep] = useState<Step>("reason");
  const [selectedSize, setSelectedSize] = useState(SIZES[1]); // Default 1TB
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const usedBytes = userQuota?.quota?.used ?? 0;
  const totalBytes = userQuota?.quota?.total ?? 500 * 1024 * 1024 * 1024;
  const currentSizeStr = formatFileSize(totalBytes);

  const handleContinue = () => {
    if (!reason.trim()) {
      alert("Please provide an explanation for the request.");
      return;
    }
    setStep("summary");
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await addRequest({
        currentSize: currentSizeStr,
        requestedSize: selectedSize,
        reason: `${category}: ${reason}`,
      });
      setStep("success");
    } catch (e) {
      alert("Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <SafeAreaView style={styles.successScreen} edges={["top", "bottom"]}>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={60} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Request Submitted!</Text>
          <Text style={styles.successSubtitle}>
            Your request for {selectedSize} storage has been submitted to the IT Administration. You will be notified once it is approved.
          </Text>
          <Pressable
            style={styles.doneBtn}
            onPress={() => {
              refetchQuota();
              router.replace("/(tabs)/files");
            }}
          >
            <Text style={styles.doneBtnText}>Return to Dashboard</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => (step === "summary" ? setStep("reason") : router.back())} />
        <Text style={styles.headerTitle}>
          {step === "reason" ? "Request Storage" : "Confirm Request"}
        </Text>
        <View style={styles.spacer40} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {step === "reason" ? (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>Describe your storage needs</Text>
              <Text style={styles.subtitle}>
                Specify why you need additional storage space and select your target size.
              </Text>

              {/* Category selector */}
              <Text style={styles.label}>Select Category</Text>
              <View style={styles.categoriesRow}>
                {CATEGORIES.map((cat) => {
                  const active = cat === category;
                  return (
                    <Pressable
                      key={cat}
                      style={[styles.categoryPill, active && styles.categoryPillActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Text explanation */}
              <Text style={styles.label}>Explanation</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                value={reason}
                onChangeText={setReason}
                placeholder="Explain what project or files require this extra space..."
                placeholderTextColor={theme.colors.textMuted}
              />

              {/* Target size selector */}
              <Text style={styles.label}>Choose New Storage Size</Text>
              <View style={styles.sizesRow}>
                {SIZES.map((sz) => {
                  const active = sz === selectedSize;
                  return (
                    <Pressable
                      key={sz}
                      style={[styles.sizeCard, active && styles.sizeCardActive]}
                      onPress={() => setSelectedSize(sz)}
                    >
                      <Text style={[styles.sizeVal, active && styles.sizeValActive]}>{sz}</Text>
                      <Text style={[styles.sizeLabel, active && styles.sizeLabelActive]}>
                        Allotted Limit
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <PrimaryButton label="Continue" onPress={handleContinue} showArrow />
            </View>
          ) : (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>Review Request Summary</Text>
              <Text style={styles.subtitle}>
                Double check details of your storage upgrade request before submitting.
              </Text>

              {/* Comparison Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Current Storage</Text>
                  <Text style={styles.summaryVal}>{currentSizeStr}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Requested Storage</Text>
                  <Text style={[styles.summaryVal, { color: theme.colors.accent }]}>
                    {selectedSize}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Purpose / Reason</Text>
                  <Text style={styles.summaryReason} numberOfLines={3}>
                    {category} - {reason}
                  </Text>
                </View>
              </View>

              {/* IT card info */}
              <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={24} color={theme.colors.accent} />
                <Text style={styles.infoText}>
                  This request requires review and approval by an authorized IT Administrator.
                  Approvals are typically processed within 24 hours.
                </Text>
              </View>

              <PrimaryButton
                label="Submit Request"
                onPress={handleSubmit}
                loading={loading}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  successScreen: { flex: 1, backgroundColor: theme.colors.accent, justifyContent: "center" },
  flex: { flex: 1 },
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
  spacer40: { width: 40 },
  scroll: { padding: theme.spacing.screen },
  stepContainer: { gap: 20 },
  title: { fontSize: 22, fontWeight: "700", color: theme.colors.textDark },
  subtitle: { fontSize: 14, color: theme.colors.textMuted, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: "600", color: theme.colors.textDark, marginTop: 8 },
  categoriesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  categoryPillActive: {
    borderColor: theme.colors.accent,
    backgroundColor: "rgba(30, 58, 138, 0.1)",
  },
  categoryText: { fontSize: 13, color: theme.colors.textSecondary },
  categoryTextActive: { color: theme.colors.accent, fontWeight: "600" },
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
    color: theme.colors.text,
  },
  sizesRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  sizeCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    ...theme.shadow.card,
  },
  sizeCardActive: {
    borderColor: theme.colors.accent,
    backgroundColor: "rgba(30, 58, 138, 0.05)",
  },
  sizeVal: { fontSize: 16, fontWeight: "700", color: theme.colors.textSecondary },
  sizeValActive: { color: theme.colors.accent },
  sizeLabel: { fontSize: 10, color: theme.colors.textMuted },
  sizeLabelActive: { color: theme.colors.accent },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 20,
    gap: 14,
    ...theme.shadow.card,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  summaryLabel: { fontSize: 14, color: theme.colors.textMuted },
  summaryVal: { fontSize: 15, fontWeight: "600", color: theme.colors.textDark },
  summaryReason: { flex: 0.6, fontSize: 13, color: theme.colors.textSecondary, textAlign: "right" },
  summaryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.borderLight },
  infoCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: theme.colors.infoBg,
    borderRadius: theme.radius.lg,
    padding: 16,
    alignItems: "center",
  },
  infoText: { flex: 1, fontSize: 12, color: theme.colors.accent, lineHeight: 18 },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 24,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  successTitle: { fontSize: 26, fontWeight: "700", color: "#fff" },
  successSubtitle: { fontSize: 15, color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 22 },
  doneBtn: {
    backgroundColor: "#fff",
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 16,
    ...theme.shadow.button,
  },
  doneBtnText: { color: theme.colors.accent, fontWeight: "700", fontSize: 16 },
});
