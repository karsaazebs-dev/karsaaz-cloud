/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma file: wM1KS9mOaTys1CweXZfcsD (Cloud App)
 * Re-download: node scripts/download-figma-assets.mjs
 */

export const figmaAssets = {
  logo: require("../../assets/figma/brand/logo.png"),
  onboarding: {
    heroOrbit: require("../../assets/figma/onboarding/hero-orbit.png"),
    heroLogo: require("../../assets/figma/onboarding/hero-logo.png"),
    chipPdf: require("../../assets/figma/onboarding/chip-pdf.png"),
    chipExcel: require("../../assets/figma/onboarding/chip-excel.png"),
    chipDoc: require("../../assets/figma/onboarding/chip-doc.png"),
    chipImage: require("../../assets/figma/onboarding/chip-image.png"),
    chipAvatar: require("../../assets/figma/onboarding/chip-avatar.png"),
    shareCenter: require("../../assets/figma/onboarding/share-center.png"),
    ellipseOuter: require("../../assets/figma/onboarding/ellipse-outer.png"),
    ellipseInner: require("../../assets/figma/onboarding/ellipse-inner.png"),
    ellipseGlow: require("../../assets/figma/onboarding/ellipse-glow.png"),
    shareChipPdf: require("../../assets/figma/onboarding/share-chip-pdf.png"),
    paginationDots1: require("../../assets/figma/onboarding/pagination-dots.png"),
    paginationDots2: require("../../assets/figma/onboarding/pagination-dots-2.png"),
    ukFlag: require("../../assets/figma/onboarding/uk-flag.png"),
    photoAccess: require("../../assets/figma/onboarding/photo-access.png"),
    shareIcon: require("../../assets/figma/onboarding/share-icon.png"),
  },
  home: {
    bell: require("../../assets/figma/home/v2/bell.png"),
    avatar: require("../../assets/figma/home/v2/avatar.png"),
    folderIcon: require("../../assets/figma/home/v2/folder-icon.png"),
    folderMenu: require("../../assets/figma/home/v2/folder-menu.png"),
    fileMenu: require("../../assets/figma/home/v2/file-menu.png"),
    pdfIcon: require("../../assets/figma/home/v2/pdf-icon.png"),
    videoIcon: require("../../assets/figma/home/v2/video-icon.png"),
    excelIcon: require("../../assets/figma/home/v2/excel-icon.png"),
    download: require("../../assets/figma/home/v2/download.png"),
    docsQuick: require("../../assets/figma/home/v2/docs-quick.png"),
    pdfQuick: require("../../assets/figma/home/v2/pdf-quick.png"),
    favQuick: require("../../assets/figma/home/v2/fav-quick.png"),
    sharedQuick: require("../../assets/figma/home/v2/shared-quick.png"),
    videosQuick: require("../../assets/figma/home/v2/videos-quick.png"),
    fabPlus: require("../../assets/figma/home/v2/fab-plus.png"),
    searchTab: require("../../assets/figma/home/v2/search-tab.png"),
    homeTab: require("../../assets/figma/home/v2/home-tab.png"),
    galleryTab: require("../../assets/figma/home/v2/gallery-tab.png"),
    menuTab: require("../../assets/figma/home/v2/menu-tab.png"),
  },
  createNew: {
    upload: require("../../assets/figma/create-new/upload.png"),
    uploadOther: require("../../assets/figma/create-new/upload-other.png"),
    camera: require("../../assets/figma/create-new/camera.png"),
    folder: require("../../assets/figma/create-new/folder.png"),
    doc: require("../../assets/figma/create-new/doc.png"),
    spreadsheet: require("../../assets/figma/create-new/spreadsheet.png"),
    presentation: require("../../assets/figma/create-new/presentation.png"),
    textDoc: require("../../assets/figma/create-new/text-doc.png"),
  },
  login: {
    globe: require("../../assets/figma/login/globe.png"),
    link: require("../../assets/figma/login/link.png"),
    checkDetected: require("../../assets/figma/login/check-detected.png"),
    shieldWhite: require("../../assets/figma/login/shield-white.png"),
    lock: require("../../assets/figma/login/lock.png"),
    recentClock: require("../../assets/figma/login/recent-clock.png"),
    chevronRight: require("../../assets/figma/login/chevron-right.png"),
    back: require("../../assets/figma/login/back.png"),
    continueArrow: require("../../assets/figma/login/continue-arrow.png"),
  },
} as const;
