/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { ExpoConfig } from "expo/config";

const brand = {
  appName: "Karsaaz Sync",
  primaryColor: "#1e3a8a",
  bundleId: "com.karsaaz.sync",
  defaultServerUrl: "http://192.168.18.61:3030",
};

const config: ExpoConfig = {
  name: brand.appName,
  slug: "karsaaz-sync",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "karsaazsync",
  userInterfaceStyle: "automatic",
  extra: {
    defaultServerUrl: brand.defaultServerUrl,
    eas: {
      projectId: "karsaaz-sync-mobile",
    },
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: brand.bundleId,
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
        NSExceptionDomains: {
          "192.168.18.61": { NSExceptionAllowsInsecureHTTPLoads: true },
          localhost: { NSExceptionAllowsInsecureHTTPLoads: true },
        },
      },
      UIBackgroundModes: ["fetch", "processing"],
    },
  },
  android: {
    package: brand.bundleId,
    adaptiveIcon: {
      backgroundColor: brand.primaryColor,
      foregroundImage: "./assets/images/android-icon-foreground.png",
    },
    permissions: [
      "INTERNET",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
      "USE_BIOMETRIC",
      "USE_FINGERPRINT",
      "RECEIVE_BOOT_COMPLETED",
      "WAKE_LOCK",
    ],
  },
  plugins: [
    "expo-router",
    "expo-dev-client",
    [
      "expo-build-properties",
      {
        android: {
          usesCleartextTraffic: true,
        },
      },
    ],
    "expo-secure-store",
    "expo-sqlite",
    "expo-sharing",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#fafafa",
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/images/icon.png",
        color: brand.primaryColor,
      },
    ],
    [
      "expo-background-fetch",
      {
        minimumInterval: 900,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
