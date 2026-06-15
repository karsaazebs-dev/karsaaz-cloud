/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 283:932 — share orbit illustration
 */

import { View, StyleSheet, Dimensions, Image } from "react-native";
import { figmaAssets } from "@/src/constants/assets";

const { width: SCREEN_W } = Dimensions.get("window");
const DESIGN_W = 375;

function sx(value: number): number {
  return (value / DESIGN_W) * SCREEN_W;
}

export function OnboardingShareIllustration() {
  return (
    <View style={styles.wrap}>
      <Image source={figmaAssets.onboarding.ellipseGlow} style={styles.glow} />
      <Image source={figmaAssets.onboarding.ellipseOuter} style={styles.outerRing} />
      <Image source={figmaAssets.onboarding.ellipseInner} style={styles.innerRing} />
      <Image source={figmaAssets.onboarding.shareCenter} style={styles.shareCenter} />

      <View style={[styles.chipWrap, styles.chipPdf]}>
        <Image source={figmaAssets.onboarding.chipPdf} style={styles.chipPdfIcon} />
      </View>
      <View style={[styles.chipWrap, styles.chipExcel]}>
        <Image source={figmaAssets.onboarding.chipExcel} style={styles.chipIcon} />
      </View>
      <View style={[styles.chipWrap, styles.chipDoc]}>
        <Image source={figmaAssets.onboarding.chipDoc} style={styles.chipIcon} />
      </View>
      <View style={[styles.chipWrap, styles.chipImage]}>
        <Image source={figmaAssets.onboarding.chipImage} style={styles.chipImageIcon} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 320,
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
    top: sx(105),
    resizeMode: "contain",
  },
  innerRing: {
    position: "absolute",
    width: sx(176),
    height: sx(176),
    top: sx(168),
    resizeMode: "contain",
  },
  shareCenter: {
    position: "absolute",
    width: sx(100),
    height: sx(100),
    top: sx(204),
    resizeMode: "contain",
  },
  chipWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  chipPdf: {
    left: sx(47),
    top: sx(106),
    width: sx(61.5),
    height: sx(61.5),
    transform: [{ rotate: "10.85deg" }],
  },
  chipExcel: {
    left: sx(281.25 - 10.25),
    top: sx(135),
    width: sx(56.8),
    height: sx(56.8),
    transform: [{ rotate: "4.8deg" }],
  },
  chipDoc: {
    left: sx(281.25 - 16.25),
    top: sx(318),
    width: sx(71.8),
    height: sx(71.8),
    transform: [{ rotate: "30deg" }],
  },
  chipImage: {
    left: sx(51.85),
    top: sx(335.85),
    width: sx(49.1),
    height: sx(49.1),
    transform: [{ rotate: "-24.29deg" }],
  },
  chipIcon: { width: sx(52.5), height: sx(52.5), resizeMode: "contain" },
  chipPdfIcon: { width: sx(52.5), height: sx(52.5), resizeMode: "contain" },
  chipImageIcon: { width: sx(37), height: sx(37), resizeMode: "contain" },
});
