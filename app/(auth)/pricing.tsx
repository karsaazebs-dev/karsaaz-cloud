/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:33 — pricing plan selection
 */

import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { theme } from "@/src/constants/theme";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";

type PlanId = "free" | "pro" | "business";

const PLANS: { id: PlanId; name: string; storage: string; price: string; period: string; features: string[] }[] = [
  {
    id: "free",
    name: "Free",
    storage: "5 GB",
    price: "$0",
    period: "forever",
    features: ["5 GB cloud storage", "Access from any device", "Basic file sharing", "Standard support"],
  },
  {
    id: "pro",
    name: "Pro",
    storage: "100 GB",
    price: "$4.99",
    period: "per month",
    features: ["100 GB cloud storage", "Priority sync", "Advanced sharing & permissions", "Activity history", "Priority support"],
  },
  {
    id: "business",
    name: "Business",
    storage: "500 GB",
    price: "$12.99",
    period: "per month",
    features: ["500 GB cloud storage", "Team collaboration", "Admin dashboard", "Audit logs", "Dedicated support"],
  },
];

export default function PricingScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<PlanId>("pro");

  const handleContinue = () => {
    router.replace("/(tabs)" as any);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Choose your plan</Text>
        <Text style={styles.subheading}>Upgrade anytime. Cancel whenever you want.</Text>

        <View style={styles.plans}>
          {PLANS.map((plan) => {
            const active = selected === plan.id;
            return (
              <Pressable
                key={plan.id}
                style={[styles.card, active && styles.cardActive]}
                onPress={() => setSelected(plan.id)}
              >
                {active && <View style={styles.activeBorder} />}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={[styles.planName, active && styles.planNameActive]}>{plan.name}</Text>
                    <Text style={styles.storage}>{plan.storage}</Text>
                  </View>
                  <View style={styles.priceBlock}>
                    <Text style={[styles.price, active && styles.priceActive]}>{plan.price}</Text>
                    <Text style={styles.period}>{plan.period}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.features}>
                  {plan.features.map((f) => (
                    <View key={f} style={styles.featureRow}>
                      <View style={[styles.dot, active && styles.dotActive]} />
                      <Text style={[styles.featureText, active && styles.featureTextActive]}>{f}</Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton label="Continue with selected plan" onPress={handleContinue} showArrow />

        <Pressable onPress={handleContinue} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.screen, paddingBottom: 40 },
  heading: {
    ...theme.typography.hero,
    color: theme.colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  subheading: {
    ...theme.typography.bodySm,
    color: theme.colors.textMuted,
    marginBottom: 28,
  },
  plans: { gap: 12, marginBottom: 24 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  cardActive: {
    borderColor: theme.colors.accent,
  },
  activeBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: theme.radius.xl,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  planName: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.textDark,
    marginBottom: 2,
  },
  planNameActive: { color: theme.colors.accent },
  storage: { fontSize: 13, color: theme.colors.textMuted },
  priceBlock: { alignItems: "flex-end" },
  price: { fontSize: 22, fontWeight: "700", color: theme.colors.textDark },
  priceActive: { color: theme.colors.accent },
  period: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginBottom: 14 },
  features: { gap: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.border },
  dotActive: { backgroundColor: theme.colors.accent },
  featureText: { fontSize: 13, color: theme.colors.textSecondary, flex: 1 },
  featureTextActive: { color: theme.colors.textDark },
  skipBtn: { alignItems: "center", marginTop: 12 },
  skipText: { fontSize: 14, color: theme.colors.textMuted },
});
