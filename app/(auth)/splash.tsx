/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 283:807
 */

import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { figmaAssets } from "@/src/constants/assets";
import { brand } from "@/src/constants/brand";
import { theme } from "@/src/constants/theme";
import { useOnboardingStore } from "@/src/stores/onboardingStore";

export default function SplashScreen() {
  const router = useRouter();
  const isComplete = useOnboardingStore((s) => s.isComplete);

  const logoFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoFade, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      if (isComplete) {
        router.replace("/(auth)/login");
      } else {
        router.replace("/(auth)/onboarding");
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [isComplete, router]);

  return (
    <View style={styles.screen}>
      <Animated.View
        style={[
          styles.logoShadow,
          {
            opacity: logoFade,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <View style={styles.logoCard}>
          <Image source={figmaAssets.logo} style={styles.logo} contentFit="contain" />
        </View>
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: textFade }]}>
        {brand.appName}
      </Animated.Text>
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
    marginBottom: 24,
    ...theme.shadow.logo,
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
  logo: { width: 112, height: 112 },
  title: {
    fontSize: theme.typography.title.fontSize,
    color: theme.colors.text,
    fontWeight: "600",
    letterSpacing: -0.5,
  },
});
