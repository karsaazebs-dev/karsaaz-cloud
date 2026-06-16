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
