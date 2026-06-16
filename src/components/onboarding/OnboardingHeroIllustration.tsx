/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:36 — hero orbit with floating file chips
 */

import { useEffect } from "react";
import { View, StyleSheet, Dimensions, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { figmaAssets } from "@/src/constants/assets";

const { width: SCREEN_W } = Dimensions.get("window");
const DESIGN_W = 375;

function sx(value: number): number {
  return (value / DESIGN_W) * SCREEN_W;
}

interface OnboardingHeroIllustrationProps {
  active?: boolean;
}

export function OnboardingHeroIllustration({ active = true }: OnboardingHeroIllustrationProps) {
  const outerRotate = useSharedValue(0);
  const innerRotate = useSharedValue(360);
  const centerScale = useSharedValue(0.85);
  const centerOpacity = useSharedValue(0);
  const floatPdf = useSharedValue(0);
  const floatExcel = useSharedValue(0);
  const floatDoc = useSharedValue(0);
  const floatImage = useSharedValue(0);
  const floatAvatar = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      outerRotate.value = 0;
      innerRotate.value = 360;
      centerScale.value = 0.85;
      centerOpacity.value = 0;
      return;
    }

    centerScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    centerOpacity.value = withTiming(1, { duration: 600 });

    outerRotate.value = withRepeat(
      withTiming(360, { duration: 32000, easing: Easing.linear }),
      -1,
      false
    );
    innerRotate.value = withRepeat(
      withTiming(0, { duration: 26000, easing: Easing.linear }),
      -1,
      false
    );

    const bob = (sv: ReturnType<typeof useSharedValue<number>>, up: number, down: number, duration: number) => {
      sv.value = withDelay(
        200,
        withRepeat(
          withSequence(
            withTiming(up, { duration, easing: Easing.inOut(Easing.ease) }),
            withTiming(down, { duration, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
    };

    bob(floatPdf, -8, 8, 1900);
    bob(floatExcel, 6, -6, 2100);
    bob(floatDoc, -7, 7, 2300);
    bob(floatImage, 9, -9, 2500);
    bob(floatAvatar, -5, 5, 2000);
  }, [active]);

  const outerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${outerRotate.value}deg` }],
  }));

  const innerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${innerRotate.value}deg` }],
  }));

  const centerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: centerScale.value }],
    opacity: centerOpacity.value,
  }));

  const chipPdfAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: "10.85deg" }, { translateY: floatPdf.value }],
  }));

  const chipExcelAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: "4.8deg" }, { translateY: floatExcel.value }],
  }));

  const chipDocAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: "30deg" }, { translateY: floatDoc.value }],
  }));

  const chipImageAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: "-24.29deg" }, { translateY: floatImage.value }],
  }));

  const chipAvatarAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAvatar.value }],
  }));

  return (
    <View style={styles.wrap}>
      <Image source={figmaAssets.onboarding.ellipseGlow} style={styles.glow} />
      <Animated.Image
        source={figmaAssets.onboarding.ellipseOuter}
        style={[styles.outerRing, outerAnimStyle]}
      />
      <Animated.Image
        source={figmaAssets.onboarding.ellipseInner}
        style={[styles.innerRing, innerAnimStyle]}
      />
      <Animated.View style={[styles.centerWrap, centerAnimStyle]}>
        <Image source={figmaAssets.onboarding.heroLogo} style={styles.centerLogo} />
      </Animated.View>

      <Animated.View style={[styles.chipWrap, styles.chipPdf, chipPdfAnimStyle]}>
        <Image source={figmaAssets.onboarding.chipPdf} style={styles.chipIcon} />
      </Animated.View>
      <Animated.View style={[styles.chipWrap, styles.chipExcel, chipExcelAnimStyle]}>
        <Image source={figmaAssets.onboarding.chipExcel} style={styles.chipIcon} />
      </Animated.View>
      <Animated.View style={[styles.chipWrap, styles.chipDoc, chipDocAnimStyle]}>
        <Image source={figmaAssets.onboarding.chipDoc} style={styles.chipIcon} />
      </Animated.View>
      <Animated.View style={[styles.chipWrap, styles.chipImage, chipImageAnimStyle]}>
        <Image source={figmaAssets.onboarding.chipImage} style={styles.chipImageIcon} />
      </Animated.View>
      <Animated.View style={[styles.chipWrap, styles.chipAvatar, chipAvatarAnimStyle]}>
        <Image source={figmaAssets.onboarding.chipAvatar} style={styles.chipAvatarIcon} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: sx(320),
    width: "100%",
    alignItems: "center",
  },
  glow: {
    position: "absolute",
    width: sx(169),
    height: sx(169),
    top: sx(91),
    left: sx(90),
    resizeMode: "contain",
  },
  outerRing: {
    position: "absolute",
    width: sx(302),
    height: sx(302),
    top: sx(0),
    resizeMode: "contain",
  },
  innerRing: {
    position: "absolute",
    width: sx(176),
    height: sx(176),
    top: sx(63),
    resizeMode: "contain",
  },
  centerWrap: {
    position: "absolute",
    width: sx(112),
    height: sx(112),
    top: sx(99),
    borderRadius: sx(24),
    backgroundColor: "#ffffff",
    borderWidth: 4,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#146ae3",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 8,
  },
  centerLogo: {
    width: sx(100),
    height: sx(100),
    resizeMode: "contain",
  },
  chipWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: sx(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  chipPdf: {
    left: sx(19),
    top: sx(1),
    width: sx(64),
    height: sx(64),
  },
  chipExcel: {
    right: sx(19),
    top: sx(30),
    width: sx(56),
    height: sx(56),
  },
  chipDoc: {
    right: sx(12),
    top: sx(213),
    width: sx(64),
    height: sx(64),
  },
  chipImage: {
    left: sx(23),
    top: sx(230),
    width: sx(56),
    height: sx(56),
  },
  chipAvatar: {
    left: sx(12),
    top: sx(35),
    width: sx(56),
    height: sx(56),
    borderRadius: sx(28),
    overflow: "hidden",
  },
  chipIcon: { width: sx(52), height: sx(52), resizeMode: "contain" },
  chipImageIcon: { width: sx(37), height: sx(37), resizeMode: "contain" },
  chipAvatarIcon: { width: "100%", height: "100%", resizeMode: "cover" },
});
