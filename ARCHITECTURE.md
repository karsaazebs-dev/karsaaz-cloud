# Android client layout (Karsaaz Sync)

Fork of Nextcloud Android. Build with Gradle from this directory.

## Structure

| Path | Role |
|------|------|
| `app/build.gradle.kts` | `applicationId` `com.karsaaz.sync`, flavors |
| `app/src/main/res/values/setup.xml` | Brand URLs, User-Agent, colors |
| `app/src/main/res/values/strings.xml` | English UI strings (only editable locale) |
| `app/src/main/java/com/nextcloud/` | Modern Kotlin (network, DI, Compose UI) |
| `app/src/main/java/com/owncloud/android/` | Legacy Java/Kotlin (sync, operations) |

## Build

```powershell
.\gradlew assembleGenericDebug
```

APK: `app/build/outputs/apk/generic/debug/`

See [`docs/local-development.md`](../../docs/local-development.md).
