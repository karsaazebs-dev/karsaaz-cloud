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
import { LinearGradient } from "expo-linear-gradient";
import { useUserQuota } from "@/src/hooks/useUserQuota";
import { useCreateRequestMutation } from "@/src/hooks/useQuotaAllocation";
import { theme } from "@/src/constants/theme";
import { BackButton } from "@/src/components/ui/BackButton";
import { StorageUsageBlock } from "@/src/components/storage/StorageUsageBlock";

type Step = "size" | "reason" | "success";

export default function RequestStorageScreen() {
  const router = useRouter();
  const { data: userQuota, refetch: refetchQuota } = useUserQuota();
  const createRequestMutation = useCreateRequestMutation();

  const [step, setStep] = useState<Step>("size");
  const [deltaSelection, setDeltaSelection] = useState<
    "+10 GB" | "+50 GB" | "+100 GB" | "+250 GB" | "Custom"
  >("+100 GB");
  const [customAmount, setCustomAmount] = useState("150");
  const [reason, setReason] = useState("");


  const totalBytes = userQuota?.quota?.total ?? 500 * 1024 * 1024 * 1024;
  const usedBytes = userQuota?.quota?.used ?? 0;
  const currentGb = Math.round(totalBytes / (1024 * 1024 * 1024));

  // Selected delta amount in GB
  const selectedAmount =
    deltaSelection === "Custom"
      ? parseInt(customAmount) || 0
      : parseInt(deltaSelection.replace("+", "").replace(" GB", "")) || 0;

  const newTotalGb = currentGb + selectedAmount;

  const handleContinueToReason = () => {
    if (selectedAmount <= 0) {
      alert("Please select or enter a valid storage amount.");
      return;
    }
    setStep("reason");
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert("Please provide an explanation for the request.");
      return;
    }
    const currentBytes   = currentGb * 1_073_741_824;
    const requestedBytes = newTotalGb * 1_073_741_824;
    createRequestMutation.mutate(
      { currentBytes, requestedBytes, reason },
      {
        onSuccess: () => setStep("success"),
        onError: () => alert("Failed to submit request. Please try again."),
      }
    );
  };

  if (step === "success") {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.spacer40} />
          <Text style={styles.headerTitle}>Request status</Text>
          <View style={styles.spacer40} />
        </View>

        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Request Submitted</Text>
          <Text style={styles.successSubtitle}>
            Your admin will review this request. You'll be notified once it is approved or rejected.
          </Text>

          <View style={styles.pendingBadge}>
            <Ionicons name="time-outline" size={16} color="rgb(202, 138, 4)" style={{ marginRight: 6 }} />
            <Text style={styles.pendingBadgeText}>Pending Approval</Text>
          </View>

          {/* Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Requested</Text>
              <Text style={styles.detailsRequestedVal}>+{selectedAmount} GB</Text>
            </View>
            <View style={styles.detailsDivider} />
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>New Total After Approval</Text>
              <Text style={styles.detailsTotalVal}>{newTotalGb} GB</Text>
            </View>
            <View style={styles.detailsDivider} />
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Submitted</Text>
              <Text style={styles.detailsDateVal}>Today</Text>
            </View>
          </View>

          <View style={styles.successActions}>
            <Pressable
              style={styles.gradientBtn}
              onPress={() => {
                refetchQuota();
                router.replace("/(tabs)/files");
              }}
            >
              <LinearGradient
                colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBtnStyle}
              >
                <Text style={styles.gradientBtnText}>Done</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.cancelTextBtn}
              onPress={() => {
                refetchQuota();
                router.replace("/manage-storage");
              }}
            >
              <Text style={styles.cancelTextBtnLabel}>View Request Status</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => (step === "reason" ? setStep("size") : router.back())} />
        <Text style={styles.headerTitle}>
          {step === "size" ? "Request Storage" : "Request info"}
        </Text>
        <View style={styles.spacer40} />
      </View>

      {/* Step Indicators */}
      <View style={styles.stepIndicatorRow}>
        <View style={styles.stepProgressContainer}>
          <View style={[styles.stepProgressBar, styles.stepProgressBarActive]} />
          <View style={[styles.stepProgressBar, step === "reason" && styles.stepProgressBarActive]} />
          <View style={styles.stepProgressBar} />
        </View>
        <Text style={styles.stepText}>
          {step === "size" ? "Step 1 of 3" : "Step 2 of 3"}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {step === "size" ? (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>Request More Storage</Text>
              <Text style={styles.subtitle}>
                Request additional storage from your admin.
              </Text>

              {/* Progress Quota Visual */}
              <View style={styles.storageBarContainer}>
                <StorageUsageBlock usedBytes={usedBytes} totalBytes={totalBytes} />
              </View>

              {/* Delta Selector Pills */}
              <View style={styles.deltaPillsRow}>
                {(["+10 GB", "+50 GB", "+100 GB", "+250 GB", "Custom"] as const).map((opt) => {
                  const active = opt === deltaSelection;
                  return (
                    <Pressable
                      key={opt}
                      style={[styles.deltaPill, active && styles.deltaPillActive]}
                      onPress={() => setDeltaSelection(opt)}
                    >
                      <Text style={[styles.deltaPillLabel, active && styles.deltaPillLabelActive]}>
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Storage Amount Box */}
              <Text style={styles.fieldLabel}>Storage Amount</Text>
              <View style={styles.amountInputContainer}>
                <TextInput
                  style={[styles.amountInput, deltaSelection !== "Custom" && styles.amountInputDisabled]}
                  value={deltaSelection === "Custom" ? customAmount : String(selectedAmount)}
                  onChangeText={(text) => setCustomAmount(text.replace(/[^0-9]/g, ""))}
                  keyboardType="numeric"
                  editable={deltaSelection === "Custom"}
                />
                <Text style={styles.unitText}>GB</Text>
              </View>

              <Text style={styles.hintText}>Your request will be reviewed by the admin.</Text>

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                <Pressable style={styles.gradientBtn} onPress={handleContinueToReason}>
                  <LinearGradient
                    colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtnStyle}
                  >
                    <Text style={styles.gradientBtnText}>Request storage</Text>
                  </LinearGradient>
                </Pressable>

                <Pressable style={styles.cancelTextBtn} onPress={() => router.back()}>
                  <Text style={styles.cancelTextBtnLabel}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.stepContainer}>
              {/* Selected delta pill */}
              <View style={styles.deltaBadge}>
                <Text style={styles.deltaBadgeText}>+{selectedAmount}GB Selected</Text>
              </View>

              <Text style={styles.title}>Why do you need more storage?</Text>

              {/* Explanation textarea */}
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={6}
                value={reason}
                onChangeText={setReason}
                placeholder="Example: I need more space for project files and backups."
                placeholderTextColor={theme.colors.textSubtle}
              />

              {/* Suggestions pills */}
              <View style={styles.suggestionsContainer}>
                {[
                  "Project files",
                  "Backup storage",
                  "Team documents",
                  "Video files",
                  "Archive",
                ].map((sugg) => (
                  <Pressable
                    key={sugg}
                    style={styles.suggPill}
                    onPress={() => {
                      setReason((prev) => {
                        const trimmed = prev.trim();
                        if (!trimmed) return sugg;
                        if (trimmed.includes(sugg)) return prev;
                        return `${trimmed}, ${sugg}`;
                      });
                    }}
                  >
                    <Text style={styles.suggPillText}>{sugg}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                <Pressable style={styles.gradientBtn} onPress={handleSubmit} disabled={createRequestMutation.isPending}>
                  <LinearGradient
                    colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtnStyle}
                  >
                    <Text style={styles.gradientBtnText}>
                      {createRequestMutation.isPending ? "Submitting..." : "Review Request"}
                    </Text>
                  </LinearGradient>
                </Pressable>

                <Pressable style={styles.cancelTextBtn} onPress={() => router.back()}>
                  <Text style={styles.cancelTextBtnLabel}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
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
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#09090b" },
  spacer40: { width: 40 },
  stepIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.screen,
    paddingTop: 16,
    paddingBottom: 8,
  },
  stepProgressContainer: {
    flexDirection: "row",
    gap: 6,
    flex: 1,
    marginRight: 16,
  },
  stepProgressBar: {
    height: 4,
    flex: 1,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
  },
  stepProgressBarActive: {
    backgroundColor: "#4e3cf4",
  },
  stepText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textMuted,
  },
  scroll: { padding: theme.spacing.screen, paddingBottom: 40 },
  stepContainer: { gap: 20 },
  title: { fontSize: 24, fontWeight: "700", color: "#09090b" },
  subtitle: { fontSize: 14, color: theme.colors.textMuted, lineHeight: 20 },
  storageBarContainer: {
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  storageBar: { flexDirection: "row", height: 4, borderRadius: 2, overflow: "hidden", gap: 2 },
  barSeg: { borderRadius: 2 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 10, color: theme.colors.textMuted },
  deltaPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  deltaPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  deltaPillActive: {
    backgroundColor: "#4e3cf4",
    borderColor: "#4e3cf4",
  },
  deltaPillLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#09090b",
  },
  deltaPillLabelActive: {
    color: "#fff",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#09090b",
    marginTop: 8,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "600",
    color: "#09090b",
  },
  amountInputDisabled: {
    color: theme.colors.textMuted,
  },
  unitText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  hintText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  actionsContainer: {
    gap: 12,
    marginTop: 16,
  },
  gradientBtn: {
    borderRadius: theme.radius.md,
    overflow: "hidden",
    ...theme.shadow.button,
  },
  gradientBtnStyle: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelTextBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelTextBtnLabel: {
    color: theme.colors.textMuted,
    fontWeight: "600",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  deltaBadge: {
    backgroundColor: "#4e3cf4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    alignSelf: "flex-start",
  },
  deltaBadgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  textArea: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 16,
    fontSize: 15,
    minHeight: 140,
    color: theme.colors.text,
    textAlignVertical: "top",
  },
  suggestionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 8,
  },
  suggPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  suggPillText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 20,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#09090b",
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
  },
  pendingBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgb(161, 98, 7)",
  },
  detailsCard: {
    width: "100%",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 20,
    gap: 14,
    ...theme.shadow.card,
    marginVertical: 12,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailsLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  detailsRequestedVal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3b82f6",
  },
  detailsTotalVal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10b981",
  },
  detailsDateVal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  detailsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
  },
  successActions: {
    width: "100%",
    gap: 12,
    marginTop: 16,
  },
});
