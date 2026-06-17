# Karsaaz Cloud Mobile — Plans.md

作成日: 2026-06-16

---

## Phase 1: File Context Menu — Full Action Set

Expand the 3-dot popup in `FilesBrowser.tsx` to match the Android app's full action set.
All backend APIs and React Query mutations already exist in `useFiles.ts` — this phase is
purely UI wiring.

| Task | 内容 | DoD | Depends | Status |
|------|------|-----|---------|--------|
| 1.1 | **Expand popup menu** — replace the current 3-item `popupMenu` in `src/components/files/FilesBrowser.tsx` with full action list: Rename, Move, Favorite/Unfavorite, Download, Tags, Delete, Share. Each item calls the appropriate handler prop (add new props to `FilesBrowserProps`). [tdd:skip:ui-component] | Menu renders all 8 actions; Favorite shows star-filled when `file.isFavorite`; tapping each calls correct prop | - | cc:完了 |
| 1.2 | **Rename dialog** — `src/components/files/RenameDialog.tsx`. Modal bottom sheet with TextInput pre-filled with current name, calls `renameMutation` from `useFiles`. Show validation error if name is empty or unchanged. [tdd:skip:ui-modal] | Rename persists to server; file list refreshes; error state shown on server failure | 1.1 | cc:完了 |
| 1.3 | **Move picker** — `src/components/files/MovePickerSheet.tsx`. Bottom sheet that shows a `FlatList` of folders (calls `listDirectory`) at `/`, user can navigate into sub-folders, taps "Move Here" to confirm. Calls `moveMutation`. [tdd:skip:ui-modal] | File moves to selected folder; original location refreshes; cannot move folder into itself | 1.1 | cc:完了 |
| 1.4 | **Favorite toggle** — wire `favoriteMutation` from `useFiles` directly on tap in menu (no separate screen). Add star icon overlay on file thumbnail in both list and grid views when `file.isFavorite === true`. [tdd:skip:ui-inline] | Star icon toggles immediately (optimistic); server syncs; Favorites filter in FilesBrowser shows correct files | 1.1 | cc:完了 |
| 1.5 | **Download action** — wire `downloadMutation` from `useFiles` in menu. Show `ActivityIndicator` in menu item while pending. On success call `Sharing.shareAsync` (already done in the mutation). [tdd:skip:ui-inline] | Tapping Download triggers system share sheet with the file; loading state visible during download | 1.1 | cc:完了 |

---

## Phase 2: Folder Creation System

New folder creation flow triggered from the FAB (`+` button) with a choice sheet.

| Task | 内容 | DoD | Depends | Status |
|------|------|-----|---------|--------|
| 2.1 | **FAB action sheet** — `src/components/files/FabSheet.tsx`. When FAB is pressed, show a bottom sheet with two options: "Upload File" (existing picker flow) and "New Folder". [tdd:skip:ui-modal] | Bottom sheet appears; "Upload File" triggers existing document picker; "New Folder" opens 2.2 | - | cc:完了 |
| 2.2 | **New Folder dialog** — `src/components/files/NewFolderDialog.tsx`. Modal with TextInput for folder name (max 255 chars, no `/` or `\`). Calls `mkdirMutation` from `useFiles`. Auto-dismiss on success. [tdd:skip:ui-modal] | Folder appears in file list immediately after creation; duplicate name shows error from server; empty name is disabled | 2.1 | cc:完了 |
| 2.3 | **Wire FAB in all browse screens** — update `app/(tabs)/files.tsx` and `app/(tabs)/index.tsx` to pass `onFabPress` through to `FabSheet`. Remove the old direct `DocumentPicker` call from `onFabPress`. [tdd:skip:wiring] | Both Home tab and Files tab show the two-option FAB sheet; existing upload flow still works | 2.1, 2.2 | cc:完了 |

---

## Phase 3: Tag System UI

Surface the existing `tagsStore` and `@karsaaz/cloud-api` systemtags integration through a polished UI. The store and all API calls already exist — this phase is UI only.

| Task | 内容 | DoD | Depends | Status |
|------|------|-----|---------|--------|
| 3.1 | **Tags bottom sheet** — `src/components/files/TagsSheet.tsx`. Bottom sheet opened from the "Tags" menu action. Shows: (a) list of all tags from `tagsStore.tags` as colored chips with checkboxes indicating if assigned to the current file; (b) "Create new tag" row with TextInput + color picker (6 preset colors). Tapping a chip calls `assignTag` or `unassignTag`. [tdd:skip:ui-modal] | Tags load from store; toggle assign/unassign syncs to server; new tag appears immediately in list; color picker shows 6 options | Phase 1 | cc:完了 |
| 3.2 | **Tag chips on file cards** — in `FilesBrowser.tsx` list view, below the file name row, show up to 3 tag chips for files that have assigned tags (from `tagsStore.getTagsForFile`). Each chip shows tag name with colored dot. [tdd:skip:ui-component] | Tags render on file cards in list view; max 3 chips shown with "+N more" if more exist; grid view unchanged | 3.1 | cc:完了 |
| 3.3 | **Load file tags on browse** — in `FilesBrowser.tsx` (or the parent screen), after files list loads, call `tagsStore.loadFileTags(file.fileId, file.path)` for each file to populate tag assignments. Debounce / batch to avoid too many concurrent calls. [tdd:skip:side-effect] | File cards show correct tags after list renders; no API call storms; graceful degradation when offline | 3.2 | cc:完了 |
| 3.4 | **Tags filter in browse** — add a "Tags" filter chip in the `toolbar` row of `FilesBrowser.tsx`. Tapping it opens a picker of all tags; selecting a tag filters `visibleFiles` to only files with that tag assigned. [tdd:skip:ui-filter] | Selecting a tag filters the file list; clearing the filter restores all files; works with existing search query | 3.1, 3.3 | cc:完了 |

---

## Phase 4: Bug Fixes (Figma Audit)

Concrete bugs discovered by diffing implementation against Figma nodes 1-2034, 1-640, 1-15, 1-4145, 1-3487, 1-1625.

| Task | 内容 | DoD | Depends | Status |
|------|------|-----|---------|--------|
| 4.1 | **FileDetailsSheet — remove duplicate "Edit" action** — `src/components/files/FileDetailsSheet.tsx`. `BASE_ACTIONS` already contains `{ id: "edit", … }` at index 0; the constructed `actions` array also prepends a second `edit` entry before `favourite`. Remove the standalone `edit` from the prepended array so "Edit" only appears once (from `BASE_ACTIONS`). [tdd:skip:ui-component] | FileDetailsSheet renders exactly one "Edit" row; order is Edit → Add to favourite → Details → Rename → … → Delete | - | cc:完了 |
| 4.2 | **FolderDetailsSheet — dynamic favourite label** — `src/components/files/FolderActionsSheet.tsx`. The favourite action always shows "Add to favourite" regardless of whether the folder is already favourited. Import `useFavoritesStore` and call `isFavorite(folder.path)` to toggle label to "Remove from favourite" and icon to filled `star` when true. [tdd:skip:ui-component] | Label reads "Remove from favourite" + filled star when folder path is in favourites store; reverts to "Add to favourite" + outline star when removed | - | cc:完了 |
| 4.3 | **FolderDetailsSheet — wrap actions in ScrollView** — `src/components/files/FolderActionsSheet.tsx`. Actions list is not wrapped in a ScrollView; on small screens or with many actions the bottom items are clipped. Wrap the actions `map` in `<ScrollView bounces={false} showsVerticalScrollIndicator={false}>` matching the pattern already used in `FileDetailsSheet.tsx`. [tdd:skip:ui-component] | All folder actions are reachable via scroll on a 5.4-inch viewport; sheet max height does not exceed 85% of screen | 4.2 | cc:完了 |
| 4.4 | **MoveToFolderModal — replace Alert.prompt with NewFolderDialog** — `src/components/files/MoveToFolderModal.tsx`. `handleCreateFolder` uses `Alert.prompt` which is iOS-only and crashes on Android. Replace with a `NewFolderDialog` instance: add `showNewFolder` boolean state, render `<NewFolderDialog visible={showNewFolder} onClose={…} onCreate={…} isPending={…} />` inside the modal, and trigger it from the "New Folder" button. [tdd:skip:ui-modal] | "New Folder" button opens `NewFolderDialog` on both iOS and Android; created folder appears in the folder list inside the modal; no `Alert.prompt` call remains | - | cc:完了 |
| 4.5 | **DashboardView — fix "Alloted" typo** — `src/components/home/DashboardView.tsx` line 155. `storageTitle: "Alloted Storage"` → `"Allocated Storage"`. [tdd:skip:copy] | String "Alloted" does not appear anywhere in the file; "Allocated Storage" renders on the dashboard storage widget | - | cc:完了 |
| 4.6 | **OnboardingCarousel — fix slide 3 illustration** — `src/components/onboarding/OnboardingCarousel.tsx`. Slide with `kind: "hero3"` uses `illustration: figmaAssets.onboarding.hero2` instead of `figmaAssets.onboarding.hero3`. Change to `hero3`. [tdd:skip:ui-component] | Third onboarding slide renders the correct hero3 asset; hero2 is only used on the second slide | - | cc:完了 |

---

## Phase 5: UI Polish (Figma Audit)

Visual refinements that don't change functionality but align implementation with Figma specs.

| Task | 内容 | DoD | Depends | Status |
|------|------|-----|---------|--------|
| 5.1 | **FilesBrowser — image thumbnail preview** — `src/components/files/FilesBrowser.tsx` `renderListItem`. For files where `item.fileType === "image"` or `item.mimeType?.startsWith("image/")`, render an `<Image>` thumbnail using the file's download URL instead of the generic `image-outline` Ionicons glyph. Fall back to the icon if the URL is unavailable or image fails to load (`onError`). Use `width: 56, height: 54, borderRadius: 12` matching `styles.thumb`. [tdd:skip:ui-component] | Image files show a thumbnail in list view; non-image files still show document/folder icon; failed loads fall back to icon; no layout shift | - | cc:完了 |
| 5.2 | **FilesBrowser — descriptive sort labels** — `src/components/files/FilesBrowser.tsx`. `sortLabel` only shows `"A - Z"` or `"Sorted"`. Replace with labels that reflect the active sort: `name-asc` → `"Name A→Z"`, `name-desc` → `"Name Z→A"`, `date-desc` → `"Date"`, `size-desc` → `"Size"`. [tdd:skip:ui-component] | Toolbar shows one of four specific sort labels; label updates immediately when user cycles through sort options | - | cc:完了 |
| 5.3 | **FigmaTabBar — inactive icon tint on dark background** — `src/components/ui/FigmaTabBar.tsx`. Inactive tab icons have no `tintColor` applied, making them invisible against the dark `#1d1f2b` background when using dark-colored asset images. Apply `tintColor: "#9ca3af"` (neutral-400) to inactive icon images so all 5 tabs are always visible. [tdd:skip:ui-component] | All 5 tab icons are visible in inactive state on the dark background; active tab icon retains `#09090b` tint inside the white pill | - | cc:完了 |
