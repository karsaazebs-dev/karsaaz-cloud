/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma nodes 283:828, 283:932, photo + notifications slides
 */

import { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  Pressable,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { BackButton } from "@/src/components/ui/BackButton";
import { LanguageSelector } from "@/src/components/ui/LanguageSelector";
import { OnboardingShareIllustration } from "@/src/components/onboarding/OnboardingShareIllustration";
import { OnboardingHeroIllustration } from "@/src/components/onboarding/OnboardingHeroIllustration";
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

  // Reanimated values for slides 3 & 4
  const slide3Scale = useSharedValue(0.7);
  const slide3Opacity = useSharedValue(0);
  const slide3TranslateY = useSharedValue(0);

  const card1TranslateY = useSharedValue(50);
  const card1Opacity = useSharedValue(0);
  const card2TranslateY = useSharedValue(50);
  const card2Opacity = useSharedValue(0);
  const centerScale = useSharedValue(1);
  const ringRotation = useSharedValue(0);

  useEffect(() => {
    if (index === 2) {
      slide3Scale.value = withTiming(1, { duration: 600 });
      slide3Opacity.value = withTiming(1, { duration: 600 });
      slide3TranslateY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      slide3Scale.value = 0.7;
      slide3Opacity.value = 0;
      slide3TranslateY.value = 0;
    }

    if (index === 3) {
      card1TranslateY.value = withDelay(150, withTiming(0, { duration: 500 }));
      card1Opacity.value = withDelay(150, withTiming(1, { duration: 500 }));
      card2TranslateY.value = withDelay(350, withTiming(0, { duration: 500 }));
      card2Opacity.value = withDelay(350, withTiming(1, { duration: 500 }));
      centerScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      ringRotation.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      card1TranslateY.value = 50;
      card1Opacity.value = 0;
      card2TranslateY.value = 50;
      card2Opacity.value = 0;
      centerScale.value = 1;
      ringRotation.value = 0;
    }
  }, [index]);

  const slide3AnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: slide3Scale.value },
      { translateY: slide3TranslateY.value }
    ],
    opacity: slide3Opacity.value,
  }));

  const card1AnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: card1TranslateY.value }],
    opacity: card1Opacity.value,
  }));

  const card2AnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: card2TranslateY.value }],
    opacity: card2Opacity.value,
  }));

  const centerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: centerScale.value }],
  }));

  const innerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }));

  const avatarRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-ringRotation.value}deg` }],
  }));

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

  const renderIllustration = (slide: Slide, slideIndex: number) => {
    const isActive = slideIndex === index;
    if (slide.kind === "hero") {
      return <OnboardingHeroIllustration active={isActive} />;
    }
    if (slide.kind === "share") {
      return <OnboardingShareIllustration active={isActive} />;
    }
    if (slide.kind === "photos") {
      return (
        <Animated.View style={slide3AnimStyle}>
          <ExpoImage
            source={figmaAssets.onboarding.photoAccess}
            style={styles.photoIllustration}
            contentFit="contain"
          />
        </Animated.View>
      );
    }
    return (
      <View style={styles.notifyWrap}>
        <Animated.View style={[styles.notifyCard, card1AnimStyle]}>
          <Image source={figmaAssets.onboarding.maya} style={styles.notifyAvatar} />
          <View style={styles.notifyBody}>
            <Text style={styles.notifyName}>Maya Chen</Text>
            <Text style={styles.notifyMsg}>Shared "Q3_Report.pdf" with you</Text>
          </View>
          <Text style={styles.notifyTime}>now</Text>
        </Animated.View>
        <Animated.View style={[styles.notifyCard, card2AnimStyle]}>
          <Image source={figmaAssets.onboarding.tom} style={styles.notifyAvatar} />
          <View style={styles.notifyBody}>
            <Text style={styles.notifyName}>Tom Avril</Text>
            <Text style={styles.notifyMsg}>Backup completed · 22.5 GB synced</Text>
          </View>
          <Text style={styles.notifyTime}>2m</Text>
        </Animated.View>
        <View style={styles.networkRing}>
          <View style={styles.outerRing}>
            <Animated.View style={[styles.innerRing, innerRingStyle]}>
              <Animated.Image source={figmaAssets.onboarding.userOrbit1} style={[styles.avatarOrbit1, avatarRotationStyle]} />
              <Animated.Image source={figmaAssets.onboarding.userOrbit2} style={[styles.avatarOrbit2, avatarRotationStyle]} />
              <Animated.Image source={figmaAssets.onboarding.userOrbit3} style={[styles.avatarOrbit3, avatarRotationStyle]} />
              <Animated.Image source={figmaAssets.onboarding.userOrbit4} style={[styles.avatarOrbit4, avatarRotationStyle]} />
              <Animated.View style={[styles.badgeBell, avatarRotationStyle]}>
                <Ionicons name="notifications" size={18} color="#ffffff" />
              </Animated.View>
              <Animated.View style={[styles.badgeHeart, avatarRotationStyle]}>
                <Ionicons name="heart" size={18} color="#ff4d4f" />
              </Animated.View>
            </Animated.View>
            <Animated.View style={[styles.avatarCenter, centerAnimStyle]}>
              <Image source={figmaAssets.onboarding.userCenter} style={{ width: "100%", height: "100%", borderRadius: 46.25 }} />
            </Animated.View>
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

      {renderIllustration(item, slideIndex)}

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
    height: 350,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  outerRing: {
    width: 333,
    height: 333,
    borderRadius: 166.5,
    borderWidth: 1,
    borderColor: "rgba(43,127,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  innerRing: {
    width: 240.5,
    height: 240.5,
    borderRadius: 120.25,
    borderWidth: 1,
    borderColor: "rgba(43,127,255,0.1)",
    position: "absolute",
  },
  avatarCenter: {
    width: 92.5,
    height: 92.5,
    borderRadius: 46.25,
    borderWidth: 4,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    position: "absolute",
  },
  avatarOrbit1: {
    width: 55.5,
    height: 55.5,
    borderRadius: 27.75,
    borderWidth: 2,
    borderColor: "#ffffff",
    position: "absolute",
    left: 27.75,
    top: 4.63,
  },
  avatarOrbit2: {
    width: 50.88,
    height: 50.88,
    borderRadius: 25.44,
    borderWidth: 2,
    borderColor: "#ffffff",
    position: "absolute",
    right: 18.5,
    top: 13.88,
  },
  avatarOrbit3: {
    width: 46.25,
    height: 46.25,
    borderRadius: 23.125,
    borderWidth: 2,
    borderColor: "#ffffff",
    position: "absolute",
    left: 9.25,
    bottom: 18.5,
  },
  avatarOrbit4: {
    width: 55.5,
    height: 55.5,
    borderRadius: 27.75,
    borderWidth: 2,
    borderColor: "#ffffff",
    position: "absolute",
    right: 27.75,
    bottom: 9.25,
  },
  badgeBell: {
    width: 41.6,
    height: 41.6,
    borderRadius: 20.8,
    backgroundColor: "#2b7fff",
    borderWidth: 2,
    borderColor: "#ffffff",
    position: "absolute",
    right: 55.5,
    top: -9.25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeHeart: {
    width: 41.6,
    height: 41.6,
    borderRadius: 20.8,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#ffffff",
    position: "absolute",
    left: -9.25,
    bottom: 55.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
