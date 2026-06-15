/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma nodes 283:828, 283:932, photo + notifications slides
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
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { BackButton } from "@/src/components/ui/BackButton";
import { LanguageSelector } from "@/src/components/ui/LanguageSelector";
import { OnboardingShareIllustration } from "@/src/components/onboarding/OnboardingShareIllustration";
import { figmaAssets } from "@/src/constants/assets";
import { brand } from "@/src/constants/brand";
import { theme } from "@/src/constants/theme";

const { width } = Dimensions.get("window");

interface Slide {
  id: string;
  kind: "hero" | "share" | "photos" | "notifications";
  title: string | string[];
  subtitle: string;
  showBack?: boolean;
  primaryLabel: string;
  secondaryLabel?: string;
  dotsImage?: number;
}

const SLIDES: Slide[] = [
  {
    id: "1",
    kind: "hero",
    title: ["Your Files,", "Your Cloud, Your Control"],
    subtitle:
      "Store your files on your own server and access them securely from anywhere.",
    primaryLabel: "Continue",
    dotsImage: figmaAssets.onboarding.paginationDots1,
  },
  {
    id: "2",
    kind: "share",
    title: "Access & Share Securely",
    subtitle: "Upload, preview, sync, and share files with people you trust.",
    primaryLabel: "Continue",
    dotsImage: figmaAssets.onboarding.paginationDots2,
  },
  {
    id: "3",
    kind: "photos",
    title: "Keep your file safe, always",
    subtitle:
      "Uploads require Full access to your device's photo library.",
    primaryLabel: "Continue",
  },
  {
    id: "4",
    kind: "notifications",
    title: "",
    subtitle: "",
    showBack: true,
    primaryLabel: "Turn on notifications",
    secondaryLabel: "Maybe Later",
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

  const renderIllustration = (slide: Slide) => {
    if (slide.kind === "hero") {
      return (
        <ExpoImage
          source={figmaAssets.onboarding.heroOrbit}
          style={styles.heroOrbit}
          contentFit="contain"
        />
      );
    }
    if (slide.kind === "share") {
      return <OnboardingShareIllustration />;
    }
    if (slide.kind === "photos") {
      return (
        <ExpoImage
          source={figmaAssets.onboarding.photoAccess}
          style={styles.photoIllustration}
          contentFit="contain"
        />
      );
    }
    return (
      <View style={styles.notifyWrap}>
        <View style={styles.notifyCard}>
          <View style={styles.notifyAvatar} />
          <View style={styles.notifyBody}>
            <Text style={styles.notifyName}>Maya Chen</Text>
            <Text style={styles.notifyMsg}>Shared "Q3_Report.pdf" with you</Text>
          </View>
          <Text style={styles.notifyTime}>now</Text>
        </View>
        <View style={styles.notifyCard}>
          <View style={styles.notifyAvatar} />
          <View style={styles.notifyBody}>
            <Text style={styles.notifyName}>Tom Avril</Text>
            <Text style={styles.notifyMsg}>Backup completed · 22.5 GB synced</Text>
          </View>
          <Text style={styles.notifyTime}>2m</Text>
        </View>
        <View style={styles.networkRing}>
          <View style={styles.networkCenter}>
            <Ionicons name="person" size={36} color={theme.colors.accent} />
          </View>
        </View>
      </View>
    );
  };

  const renderSlide = ({ item, index: slideIndex }: { item: Slide; index: number }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.topRow}>
        {item.showBack ? <BackButton onPress={goBack} /> : <View style={styles.spacer40} />}
        <LanguageSelector />
      </View>

      {renderIllustration(item)}

      {item.dotsImage && (
        <Image source={item.dotsImage} style={styles.dotsImage} />
      )}

      {item.kind !== "notifications" && (
        <View style={styles.copy}>
          {Array.isArray(item.title) ? (
            item.title.map((line) => (
              <Text key={line} style={styles.title}>{line}</Text>
            ))
          ) : (
            <Text style={styles.title}>{item.title}</Text>
          )}
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <PrimaryButton
          label={item.primaryLabel}
          onPress={goNext}
          icon={item.kind === "notifications" ? "notifications-outline" : undefined}
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
      <Text style={styles.brandHint}>{brand.appName}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  slide: { flex: 1, paddingHorizontal: theme.spacing.screen },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    minHeight: 40,
  },
  spacer40: { width: 40 },
  heroOrbit: {
    width: 320,
    height: 320,
    alignSelf: "center",
    marginBottom: 8,
  },
  photoIllustration: { width: 220, height: 220, alignSelf: "center", marginVertical: 40 },
  notifyWrap: { minHeight: 380, gap: 12 },
  notifyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    ...theme.shadow.card,
  },
  notifyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.infoBg,
  },
  notifyBody: { flex: 1 },
  notifyName: { fontSize: 14, color: theme.colors.text, marginBottom: 2 },
  notifyMsg: { fontSize: 12, color: theme.colors.textSubtle },
  notifyTime: { fontSize: 12, color: theme.colors.textSubtle },
  networkRing: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  networkCenter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.card,
  },
  dotsImage: {
    width: 24,
    height: 8,
    alignSelf: "center",
    marginBottom: 20,
    resizeMode: "contain",
  },
  copy: { alignItems: "center", marginBottom: 24 },
  title: {
    fontSize: theme.typography.title.fontSize,
    lineHeight: theme.typography.title.lineHeight,
    letterSpacing: theme.typography.title.letterSpacing,
    color: theme.colors.text,
    textAlign: "center",
    fontWeight: "400",
  },
  subtitle: {
    marginTop: 12,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: "center",
    maxWidth: 279,
    lineHeight: 22,
  },
  actions: { gap: 16, marginTop: "auto", paddingBottom: 16 },
  secondaryBtn: { alignItems: "center", paddingVertical: 8 },
  secondaryText: { color: theme.colors.textSubtle, fontWeight: "700", fontSize: 12 },
  brandHint: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    fontSize: 10,
    color: "transparent",
  },
});
