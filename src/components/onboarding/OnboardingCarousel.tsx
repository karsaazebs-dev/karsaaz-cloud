/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma nodes 1:36, 1:140, 1:223, etc.
 */

import { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { BackButton } from "@/src/components/ui/BackButton";
import { LanguageSelector } from "@/src/components/ui/LanguageSelector";
import { figmaAssets } from "@/src/constants/assets";
import { theme } from "@/src/constants/theme";

const { width } = Dimensions.get("window");

interface Slide {
  id: string;
  kind: "hero1" | "hero2" | "hero3" | "hero4";
  title: string;
  subtitle: string;
  showBack?: boolean;
  primaryLabel: string;
  secondaryLabel?: string;
  illustration: number;
}

const SLIDES: Slide[] = [
  {
    id: "1",
    kind: "hero1",
    title: "Your Own Cloud, Your Rules",
    subtitle: "Store files on your own server, access them securely from anywhere.",
    primaryLabel: "Continue",
    illustration: figmaAssets.onboarding.hero1,
  },
  {
    id: "2",
    kind: "hero2",
    title: "All Your Data In One Place",
    subtitle: "Photos, docs, videos, and more—organized your way.",
    primaryLabel: "Continue",
    illustration: figmaAssets.onboarding.hero2,
  },
  {
    id: "3",
    kind: "hero3",
    title: "Share With Confidence",
    subtitle: "Secure sharing and real-time collaboration with your team.",
    primaryLabel: "Continue",
    illustration: figmaAssets.onboarding.hero3,
  },
  {
    id: "4",
    kind: "hero4",
    title: "Get Started Today",
    subtitle: "Welcome to Storage.io, your personal cloud solution.",
    showBack: true,
    primaryLabel: "Get Started",
    secondaryLabel: "Skip",
    illustration: figmaAssets.onboarding.hero1,
  },
];

interface OnboardingCarouselProps {
  onComplete: () => void;
}

export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const goNext = () => {
    if (index >= SLIDES.length - 1) {
      onComplete();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    setIndex(index + 1);
  };

  const goBack = () => {
    if (index <= 0) return;
    listRef.current?.scrollToIndex({ index: index - 1, animated: true });
    setIndex(index - 1);
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.topRow}>
        {item.showBack ? <BackButton onPress={goBack} /> : <View style={styles.spacer40} />}
        <LanguageSelector />
      </View>

      <Image source={item.illustration} style={styles.illustration} />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label={item.primaryLabel}
          onPress={goNext}
        />
        {item.secondaryLabel && (
          <Pressable onPress={onComplete} style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>{item.secondaryLabel}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onMomentumScrollEnd={(e) => {
          const next = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(next);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fafafa" },
  slide: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    minHeight: 40,
    width: "100%",
  },
  spacer40: { width: 40 },
  illustration: {
    width: 226,
    height: 226,
    marginBottom: 32,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: "#2b7fff",
    width: 24,
  },
  inactiveDot: {
    backgroundColor: "#d4d4d4",
  },
  copy: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    color: "#09090b",
    textAlign: "center",
    fontWeight: "400",
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: "#555555",
    textAlign: "center",
    maxWidth: 279,
    lineHeight: 22,
  },
  actions: {
    width: "100%",
    gap: 16,
    marginTop: "auto",
    paddingBottom: 16,
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  secondaryText: {
    color: "#71717b",
    fontWeight: "700",
    fontSize: 12,
  },
});
