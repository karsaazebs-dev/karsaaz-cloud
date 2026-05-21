# SPDX-FileCopyrightText: 2017 Nextcloud GmbH and Nextcloud contributors
# SPDX-FileCopyrightText: 2012 ownCloud GmbH
# SPDX-FileCopyrightText: 2026 Karsaaz (rebrand to Karsaaz Sync)
# SPDX-License-Identifier: GPL-2.0-or-later
#
# Karsaaz rebrand:
#   - APPLICATION_NAME ≠ "Nextcloud" → Theme::isBranded() returns true at
#     runtime, which enables the branded-mode code paths in libsync.
#   - Executable name kebab-cased ('karsaaz-sync') so it's a valid Linux
#     command and a sensible Windows .exe basename.
#   - The 'Dev' suffix is preserved for NEXTCLOUD_DEV builds so dev binaries
#     can coexist with installed Karsaaz Sync builds.
if(NEXTCLOUD_DEV)
    set( APPLICATION_NAME       "Karsaaz Sync Dev" )
    set( APPLICATION_SHORTNAME  "KarsaazSyncDev" )
    set( APPLICATION_EXECUTABLE "karsaaz-sync-dev" )
else()
    set( APPLICATION_NAME       "Karsaaz Sync" )
    set( APPLICATION_SHORTNAME  "KarsaazSync" )
    set( APPLICATION_EXECUTABLE "karsaaz-sync" )
endif()
# Karsaaz: ICON_NAME deliberately falls back to "Nextcloud" — the theme/
# directory still ships only the upstream SVG set under theme/colored/nextcloud/,
# theme/black/nextcloud/, theme/white/nextcloud/. Once Karsaaz-branded SVGs are
# dropped under theme/colored/KarsaazSync/ (etc.) — see /.fork-reports/phase-5-rebrand.md
# section "Outstanding visual-asset work" — change this to ${APPLICATION_SHORTNAME}.
set( APPLICATION_ICON_NAME      "KarsaazSync" )

set( APPLICATION_CONFIG_NAME "${APPLICATION_EXECUTABLE}" )
set( APPLICATION_DOMAIN     "karsaaz.com" )
set( APPLICATION_VENDOR     "Karsaaz" )
# Phase-2 sever: APPLICATION_UPDATE_URL defaults to empty so the auto-updater
# (Sparkle on macOS, OCUpdater on Win/Linux) is disabled. Set to a Karsaaz-
# operated appcast URL only if/when Karsaaz signs and hosts its own builds.
set( APPLICATION_UPDATE_URL "" CACHE STRING "URL for updater (empty = disabled)" )
set( APPLICATION_HELP_URL   "https://karsaaz.com/support" CACHE STRING "URL for the help menu" )

# Karsaaz: this conditional was for a macOS-specific icon swap that only fired
# when APPLICATION_NAME == "Nextcloud". Since we renamed it, the branch can
# never fire; leaving the logic in place for clarity but it's now inert.
if(APPLE AND APPLICATION_NAME STREQUAL "Nextcloud" AND EXISTS "${CMAKE_SOURCE_DIR}/theme/colored/Nextcloud-macOS-icon.svg")
    set( APPLICATION_ICON_NAME "Nextcloud-macOS" )
    message("Using macOS-specific application icon: ${APPLICATION_ICON_NAME}")
endif()

set( APPLICATION_ICON_SET   "SVG" )
# Karsaaz pre-fills the live LAN server URL by default. APPLICATION_SERVER_URL_ENFORCE
# keeps the wizard from offering a different one. Override at CMake time with
# -DAPPLICATION_SERVER_URL=https://your-prod-url when building Karsaaz prod packages.
set( APPLICATION_SERVER_URL "http://192.168.18.97:3030" CACHE STRING "URL for the server to use. If entered, the UI field will be pre-filled with it" )
set( APPLICATION_SERVER_URL_ENFORCE ON ) # If set and APPLICATION_SERVER_URL is defined, the server can only connect to the pre-defined URL
set( APPLICATION_REV_DOMAIN "com.karsaaz.sync.desktop" )
# DEVELOPMENT_TEAM is an Apple Developer Team ID — required for code-signing
# on macOS. Upstream value belongs to Nextcloud GmbH; clear by default so
# Karsaaz builds either set their own at CMake time or skip code-signing.
set( DEVELOPMENT_TEAM "" CACHE STRING "Apple Development Team ID" )
set( APPLICATION_VIRTUALFILE_SUFFIX "karsaaz" CACHE STRING "Virtual file suffix (not including the .)")
set( APPLICATION_OCSP_STAPLING_ENABLED OFF )
set( APPLICATION_FORBID_BAD_SSL OFF )

set( LINUX_PACKAGE_SHORTNAME "karsaaz-sync" )
set( LINUX_APPLICATION_ID "${APPLICATION_REV_DOMAIN}.${LINUX_PACKAGE_SHORTNAME}")

# Karsaaz: THEME_CLASS still points at NextcloudTheme. We deliberately keep
# the upstream NextcloudTheme class intact (Phase-2 only changed its
# wizardUrlHint to empty); the brand cosmetics (name, vendor, colors, icons)
# are all driven by the APPLICATION_* variables above + the runtime
# Theme::isBranded() check (theme.cpp:128), which now returns true because
# APPLICATION_NAME != "Nextcloud". A future fork can subclass to
# 'KarsaazTheme' under src/libsync/ if more granular overrides are needed.
set( THEME_CLASS            "NextcloudTheme" )
set( WIN_SETUP_BITMAP_PATH  "${CMAKE_SOURCE_DIR}/admin/win/nsi" )

set( MAC_INSTALLER_BACKGROUND_FILE "${CMAKE_SOURCE_DIR}/admin/osx/installer-background.png" CACHE STRING "The MacOSX installer background image")

# set( THEME_INCLUDE          "${OEM_THEME_DIR}/mytheme.h" )
# set( APPLICATION_LICENSE    "${OEM_THEME_DIR}/license.txt )

## Updater options
option( BUILD_UPDATER "Build updater" ON )

option( WITH_PROVIDERS "Build with providers list" ON )

option( ENFORCE_VIRTUAL_FILES_SYNC_FOLDER "Enforce use of virtual files sync folder when available" OFF )
option( DISABLE_VIRTUAL_FILES_SYNC_FOLDER "Disable use of virtual files sync folder even when available" OFF )

option(ENFORCE_SINGLE_ACCOUNT "Enforce use of a single account in desktop client" OFF)

option( DO_NOT_USE_PROXY "Do not use system wide proxy, instead always do a direct connection to server" OFF )

option( WIN_DISABLE_USERNAME_PREFILL "Do not prefill the Windows user name when creating a new account" OFF )

## Theming options — Karsaaz brand colors (see workspace AGENTS.md §3)
set(NEXTCLOUD_BACKGROUND_COLOR "#1e3a8a" CACHE STRING "Default Karsaaz background color (Karsaaz navy)")
set( APPLICATION_WIZARD_HEADER_BACKGROUND_COLOR ${NEXTCLOUD_BACKGROUND_COLOR} CACHE STRING "Hex color of the wizard header background")
set( APPLICATION_WIZARD_HEADER_TITLE_COLOR "#ffffff" CACHE STRING "Hex color of the text in the wizard header")
option( APPLICATION_WIZARD_USE_CUSTOM_LOGO "Use the logo from ':/client/theme/colored/wizard_logo.(png|svg)' else the default application icon is used" ON )

#
## Windows Shell Extensions & MSI - IMPORTANT: Generate new GUIDs for custom builds with "guidgen" or "uuidgen"
#
if(WIN32)
    # Context Menu
    set( WIN_SHELLEXT_CONTEXT_MENU_GUID      "{BC6988AB-ACE2-4B81-84DC-DC34F9B24401}" )

    # Overlays
    set( WIN_SHELLEXT_OVERLAY_GUID_ERROR     "{E0342B74-7593-4C70-9D61-22F294AAFE05}" )
    set( WIN_SHELLEXT_OVERLAY_GUID_OK        "{E1094E94-BE93-4EA2-9639-8475C68F3886}" )
    set( WIN_SHELLEXT_OVERLAY_GUID_OK_SHARED "{E243AD85-F71B-496B-B17E-B8091CBE93D2}" )
    set( WIN_SHELLEXT_OVERLAY_GUID_SYNC      "{E3D6DB20-1D83-4829-B5C9-941B31C0C35A}" )
    set( WIN_SHELLEXT_OVERLAY_GUID_WARNING   "{E4977F33-F93A-4A0A-9D3C-83DEA0EE8483}" )

    # MSI Upgrade Code (without brackets)
    set( WIN_MSI_UPGRADE_CODE                "FD2FCCA9-BB8F-4485-8F70-A0621B84A7F4" )

    # Windows build options
    option( BUILD_WIN_MSI "Build MSI scripts and helper DLL" OFF )
    option( BUILD_WIN_TOOLS "Build Win32 migration tools" OFF )
endif()

if (APPLE AND CMAKE_OSX_DEPLOYMENT_TARGET VERSION_GREATER_EQUAL 11.0)
    option( BUILD_FILE_PROVIDER_MODULE "Build the macOS virtual files File Provider module" OFF )
endif()
