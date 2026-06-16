/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { figmaAssets } from "@/src/constants/assets";
import type { KarsaazFile } from "@karsaaz/cloud-api";
import { useUiStore } from "@/src/stores/uiStore";
import { useFavoritesStore } from "@/src/stores/favoritesStore";
import { useAuthStore } from "@/src/stores/authStore";
import { useTagsStore, parseTagDisplay } from "@/src/stores/tagsStore";
import type { BrowseFilter } from "@/src/stores/uiStore";
import { filterFiles, sortFiles, formatFileDate, formatFileSize } from "@/src/utils/fileFilters";

const GRID_COLS = 3;
const GRID_GAP = 8;
const GRID_SIZE =
  (Dimensions.get("window").width - 24 * 2 - GRID_GAP * (GRID_COLS - 1)) /
  GRID_COLS;

interface FilesBrowserProps {
  files: KarsaazFile[];
  isLoading: boolean;
  isRefetching: boolean;
  title?: string;
  filter?: BrowseFilter;
  onRefresh: () => void;
  onOpen: (file: KarsaazFile) => void;
  onShare: (file: KarsaazFile) => void;
  onMenu: (file: KarsaazFile) => void;
  onAvatarPress: () => void;
  onBackToDashboard?: () => void;
  onRename: (file: KarsaazFile) => void;
  onMove: (file: KarsaazFile) => void;
  onFavorite: (file: KarsaazFile) => void;
  onDownload: (file: KarsaazFile) => void;
  downloadingFilePath?: string | null;
  onTags: (file: KarsaazFile) => void;
  onDelete: (file: KarsaazFile) => void;
}

export function FilesBrowser({
  files,
  isLoading,
  isRefetching,
  title = "All files",
  filter: filterProp,
  onRefresh,
  onOpen,
  onShare,
  onMenu,
  onAvatarPress,
  onBackToDashboard,
  onRename,
  onMove,
  onFavorite,
  onDownload,
  downloadingFilePath,
  onTags,
  onDelete,
}: FilesBrowserProps) {
  const displayName = useAuthStore((s) => s.displayName);
  const searchQuery = useUiStore((s) => s.searchQuery);
  const setSearchQuery = useUiStore((s) => s.setSearchQuery);
  const storeFilter = useUiStore((s) => s.browseFilter);
  const browseFilter = filterProp ?? storeFilter;
  const sortOrder = useUiStore((s) => s.sortOrder);
  const setSortOrder = useUiStore((s) => s.setSortOrder);
  const viewMode = useUiStore((s) => s.viewMode);
  const setViewMode = useUiStore((s) => s.setViewMode);
  const favoritePaths = useFavoritesStore((s) => s.paths);
  const getTagsForFile = useTagsStore((s) => s.getTagsForFile);
  const tagsAll = useTagsStore((s) => s.tags);
  const loadFileTags = useTagsStore((s) => s.loadFileTags);
  const [menuFileId, setMenuFileId] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const loadedPathsRef = useRef(new Set<string>());

  // Load tags for all files in the list (once per path)
  useEffect(() => {
    for (const f of files) {
      if (f.type === "file" && f.fileId && !loadedPathsRef.current.has(f.path)) {
        loadedPathsRef.current.add(f.path);
        loadFileTags(f.fileId, f.path).catch(() => {});
      }
    }
  }, [files]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleFiles = useMemo(() => {
    let result = sortFiles(filterFiles(files, browseFilter, favoritePaths, searchQuery), sortOrder);
    if (tagFilter) {
      result = result.filter((f) => getTagsForFile(f.path).includes(tagFilter));
    }
    return result;
  }, [files, browseFilter, favoritePaths, searchQuery, sortOrder, tagFilter, getTagsForFile]);

  const cycleSort = () => {
    const order = ["name-asc", "name-desc", "date-desc", "size-desc"] as const;
    const idx = order.indexOf(sortOrder);
    setSortOrder(order[(idx + 1) % order.length]);
  };

  const sortLabel =
    sortOrder === "name-asc" || sortOrder === "name-desc" ? "A - Z" : "Sorted";

  const closeMenu = () => setMenuFileId(null);

  const renderListItem = ({ item }: { item: KarsaazFile }) => {
    const isFav = favoritePaths.includes(item.path);
    const fileTags = getTagsForFile(item.path);
    const displayTags = fileTags.slice(0, 3);
    const extraCount = fileTags.length - displayTags.length;

    return (
      <View>
        <Pressable
          style={[styles.fileCard, menuFileId === item.path && styles.fileCardActive]}
          onPress={() => {
            if (menuFileId) { closeMenu(); return; }
            onOpen(item);
          }}
        >
          <View style={styles.thumb}>
            <Ionicons
              name={item.type === "directory" ? "folder" : "image-outline"}
              size={28}
              color="#4e3cf4"
            />
            {isFav && (
              <View style={styles.starBadge}>
                <Ionicons name="star" size={10} color="#f59e0b" />
              </View>
            )}
          </View>
          <View style={styles.fileMeta}>
            <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.fileSub}>
              {item.type === "directory" ? "Folder" : formatFileSize(item.size)}
              {item.type === "file" ? ` • ${formatFileDate(item.lastModified)}` : ""}
            </Text>
            {displayTags.length > 0 && (
              <View style={styles.tagRow}>
                {displayTags.map((tk) => {
                  const tag = parseTagDisplay(tk);
                  return (
                    <View key={tk} style={[styles.tagChip, { backgroundColor: tag.color + "22" }]}>
                      <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                      <Text style={[styles.tagChipText, { color: tag.color }]} numberOfLines={1}>
                        {tag.name}
                      </Text>
                    </View>
                  );
                })}
                {extraCount > 0 && (
                  <Text style={styles.tagMore}>+{extraCount} more</Text>
                )}
              </View>
            )}
          </View>
          <Pressable onPress={() => onShare(item)} hitSlop={8}>
            <Ionicons name="person-add-outline" size={20} color="#71717b" />
          </Pressable>
          <Pressable
            onPress={() => setMenuFileId(menuFileId === item.path ? null : item.path)}
            hitSlop={8}
          >
            <Ionicons name="ellipsis-vertical" size={16} color="#71717b" />
          </Pressable>
        </Pressable>

        {menuFileId === item.path && (
          <View style={styles.popupMenu}>
            <Pressable style={styles.popupItem} onPress={() => { closeMenu(); onRename(item); }}>
              <Ionicons name="pencil-outline" size={18} color="#09090b" />
              <Text style={styles.popupText}>Rename</Text>
            </Pressable>
            <Pressable style={styles.popupItem} onPress={() => { closeMenu(); onMove(item); }}>
              <Ionicons name="folder-open-outline" size={18} color="#09090b" />
              <Text style={styles.popupText}>Move</Text>
            </Pressable>
            <Pressable style={styles.popupItem} onPress={() => { closeMenu(); onFavorite(item); }}>
              <Ionicons name={isFav ? "star" : "star-outline"} size={18} color="#f59e0b" />
              <Text style={styles.popupText}>{isFav ? "Unfavorite" : "Favorite"}</Text>
            </Pressable>
            <Pressable style={styles.popupItem} onPress={() => { closeMenu(); onDownload(item); }}>
              {downloadingFilePath === item.path
                ? <ActivityIndicator size="small" color="#09090b" />
                : <Ionicons name="cloud-download-outline" size={18} color="#09090b" />}
              <Text style={styles.popupText}>Download</Text>
            </Pressable>
            <Pressable style={styles.popupItem} onPress={() => { closeMenu(); onTags(item); }}>
              <Ionicons name="pricetag-outline" size={18} color="#09090b" />
              <Text style={styles.popupText}>Tags</Text>
            </Pressable>
            <Pressable style={styles.popupItem} onPress={() => { closeMenu(); onShare(item); }}>
              <Ionicons name="share-social-outline" size={18} color="#09090b" />
              <Text style={styles.popupText}>Share</Text>
            </Pressable>
            <Pressable style={styles.popupItem} onPress={() => { closeMenu(); onDelete(item); }}>
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
              <Text style={[styles.popupText, styles.destructive]}>Delete</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  const renderGridItem = ({ item }: { item: KarsaazFile }) => (
    <Pressable style={styles.gridCard} onPress={() => onOpen(item)}>
      <View>
        <Ionicons
          name={item.type === "directory" ? "folder" : "document-outline"}
          size={32}
          color="#4e3cf4"
        />
        {favoritePaths.includes(item.path) && (
          <View style={styles.gridStarBadge}>
            <Ionicons name="star" size={9} color="#f59e0b" />
          </View>
        )}
      </View>
      <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>
    </Pressable>
  );

  const activeTagEntry = tagFilter ? parseTagDisplay(tagFilter) : null;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeTop}>
        <View style={styles.searchRow}>
          {onBackToDashboard ? (
            <Pressable onPress={onBackToDashboard} style={styles.backBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color="#09090b" />
            </Pressable>
          ) : null}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="#71717b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search files..."
              placeholderTextColor="#71717b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Pressable onPress={onAvatarPress}>
            <Image source={figmaAssets.home.avatar} style={styles.avatarImage} />
          </Pressable>
        </View>
      </SafeAreaView>

      <View style={styles.toolbar}>
        <Pressable style={styles.sortBtn} onPress={cycleSort}>
          <Text style={styles.sortLabel}>{sortLabel}</Text>
          <Ionicons name="chevron-down" size={14} color="#09090b" />
        </Pressable>
        <View style={styles.toolbarRight}>
          {tagsAll.length > 0 && (
            <Pressable
              style={[styles.tagFilterBtn, activeTagEntry && styles.tagFilterBtnActive]}
              onPress={() => setShowTagPicker((v) => !v)}
            >
              <Ionicons
                name="pricetag-outline"
                size={16}
                color={activeTagEntry ? "#4e3cf4" : "#09090b"}
              />
              {activeTagEntry && (
                <Text style={styles.tagFilterLabel} numberOfLines={1}>
                  {activeTagEntry.name}
                </Text>
              )}
            </Pressable>
          )}
          {tagFilter && (
            <Pressable onPress={() => setTagFilter(null)} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#4e3cf4" />
            </Pressable>
          )}
          <Pressable onPress={() => setViewMode(viewMode === "list" ? "grid" : "list")}>
            <Ionicons
              name={viewMode === "list" ? "grid-outline" : "list-outline"}
              size={20}
              color="#09090b"
            />
          </Pressable>
        </View>
      </View>

      {showTagPicker && (
        <View style={styles.tagPickerDropdown}>
          {tagsAll.map((tk) => {
            const tag = parseTagDisplay(tk);
            return (
              <Pressable
                key={tk}
                style={[styles.tagPickerItem, tagFilter === tk && styles.tagPickerItemActive]}
                onPress={() => {
                  setTagFilter(tagFilter === tk ? null : tk);
                  setShowTagPicker(false);
                }}
              >
                <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                <Text style={styles.tagPickerText}>{tag.name}</Text>
                {tagFilter === tk && <Ionicons name="checkmark" size={14} color="#4e3cf4" />}
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={styles.sectionTitle}>{title}</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#4e3cf4" />
      ) : (
        <FlatList
          data={visibleFiles}
          key={viewMode}
          numColumns={viewMode === "grid" ? GRID_COLS : 1}
          keyExtractor={(item) => item.path}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
          }
          renderItem={viewMode === "grid" ? renderGridItem : renderListItem}
          ListEmptyComponent={<Text style={styles.empty}>No files found</Text>}
          onScrollBeginDrag={() => { if (menuFileId) closeMenu(); }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7f7f7" },
  safeTop: { backgroundColor: "#f7f7f7" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 42, height: 42, borderRadius: 21 },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 46,
    borderWidth: 0.5,
    borderColor: "#dfe1e4",
    shadowColor: "#e4efff",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 11,
    elevation: 2,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: "#09090b" },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortLabel: { fontSize: 16, fontWeight: "500", color: "#09090b" },
  toolbarRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  tagFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dfe1e4",
  },
  tagFilterBtnActive: { borderColor: "#4e3cf4", backgroundColor: "#eef0ff" },
  tagFilterLabel: { fontSize: 12, color: "#4e3cf4", maxWidth: 60 },
  tagPickerDropdown: {
    marginHorizontal: 24,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#dfe1e4",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 20,
    marginBottom: 8,
  },
  tagPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dfe1e4",
  },
  tagPickerItemActive: { backgroundColor: "#eef0ff" },
  tagPickerText: { flex: 1, fontSize: 14, color: "#09090b" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#09090b",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  list: { paddingHorizontal: 24, paddingBottom: 120, gap: 8 },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 0.5,
    borderColor: "#dfe1e4",
    shadowColor: "#e4efff",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 11,
    elevation: 2,
  },
  fileCardActive: { backgroundColor: "#f4f4f5" },
  thumb: {
    width: 56,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  starBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#fff",
    borderRadius: 7,
    padding: 1,
  },
  fileMeta: { flex: 1 },
  fileName: { fontSize: 16, fontWeight: "500", color: "#5c5c5c" },
  fileSub: { fontSize: 13, color: "#71717b", marginTop: 2 },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 6,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagChipText: { fontSize: 11, fontWeight: "500" },
  tagMore: { fontSize: 11, color: "#71717b", alignSelf: "center" },
  popupMenu: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 4,
    marginTop: 4,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 10,
  },
  popupItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  popupText: { fontSize: 15, color: "#09090b" },
  destructive: { color: "#dc2626" },
  gridCard: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: GRID_GAP,
    marginRight: GRID_GAP,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  gridStarBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 1,
  },
  gridName: { fontSize: 12, color: "#09090b", marginTop: 8, textAlign: "center" },
  loader: { marginTop: 40 },
  empty: { textAlign: "center", color: "#71717b", marginTop: 40 },
});
