/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 283:807
 */

import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { figmaAssets } from "@/src/constants/assets";
import { brand } from "@/src/constants/brand";
import { theme } from "@/src/constants/theme";
import { useOnboardingStore } from "@/src/stores/onboardingStore";

export default function SplashScreen() {
  const router = useRouter();
  const isComplete = useOnboardingStore((s) => s.isComplete);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isComplete) {
        router.replace("/(auth)/login");
      } else {
        router.replace("/(auth)/onboarding");
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [isComplete, router]);

  return (
    <View style={styles.screen}>
      <View style={styles.logoShadow}>
        <View style={styles.logoCard}>
          <Image source={figmaAssets.logo} style={styles.logo} contentFit="contain" />
        </View>
      </View>
      <Text style={styles.title}>{brand.appName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  logoShadow: {
    borderRadius: theme.radius.xl,
    marginBottom: 20,
    shadowColor: "#146ae3",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 12,
  },
  logoCard: {
    width: 112,
    height: 112,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 4,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: { width: 113, height: 113 },
  title: {
    fontSize: 26,
    color: theme.colors.text,
    fontWeight: "400",
    letterSpacing: 0,
  },
});
