/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export const theme = {
  colors: {
    // Figma: screen backgrounds
    background: "#f7f7f7",
    surface: "#ffffff",
    surfaceMuted: "#f7f7f7",
    // Figma: text hierarchy
    text: "#09090b",
    textDark: "#09090b",
    textSecondary: "#7d7d7d",
    textMuted: "#71717b",
    textSubtle: "#242424",
    // Figma: borders & inputs
    border: "#dfe1e4",
    borderLight: "rgba(0,0,0,0.08)",
    inputBg: "#fafafa",
    // Figma: shared badge
    badgeBg: "#ddf0ff",
    badgeText: "#2b7fff",
    infoBg: "rgba(164,179,255,0.5)",
    // Figma: accent colours
    accent: "#1D84F5",
    accentBright: "#2b7fff",
    accentText: "#4b66ff",
    link: "#1d84f5",
    // Figma: status
    success: "#28bc5e",
    successBright: "#34d399",
    // Figma: gradients
    gradientStart: "#5d7cf6",
    gradientEnd: "#1D84F5",
    // Figma: tab bar & nav
    tabBar: "#1d1f2b",
    tabBarActive: "#ffffff",
    tabBarInactive: "#ffffff",
    drawerHeaderStart: "#5d7cf6",
    drawerHeaderEnd: "#1D84F5",
    // Figma: storage category colours
    storageImages: "#10b981",
    storageDocs: "#3b82f6",
    storageVideos: "#f59e0b",
    storageOther: "#d946ef",
    storageEmpty: "#cbd5e1",
    // Figma: folder gradient
    folderOrangeStart: "#f59e0b",
    folderOrangeEnd: "#ea580c",
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 999,
  },
  spacing: {
    screen: 24,
    card: 16,
    gap: 8,
  },
  typography: {
    // Figma typography scale (Inter font)
    hero: { fontSize: 30, lineHeight: 36, letterSpacing: -0.75 },
    title: { fontSize: 26, lineHeight: 40, letterSpacing: -0.85 },
    sectionHeader: { fontSize: 18, lineHeight: 18.5 },
    storageAmount: { fontSize: 24, lineHeight: 18.5 },
    body: { fontSize: 16, lineHeight: 24 },
    bodySm: { fontSize: 14, lineHeight: 20 },
    fileLabel: { fontSize: 13, lineHeight: 18.5 },
    caption: { fontSize: 12, lineHeight: 16 },
    micro: { fontSize: 11, lineHeight: 24 },
    tabLabel: { fontSize: 10, lineHeight: 24 },
    button: { fontSize: 13, lineHeight: 18.5, letterSpacing: -0.14 },
  },
  shadow: {
    card: {
      shadowColor: "#0f172a",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    button: {
      shadowColor: "#1e3a8a",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 4,
    },
    logo: {
      shadowColor: "#1e3a8a",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 8,
    },
  },
} as const;
