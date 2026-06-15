/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUiStore } from "@/src/stores/uiStore";
import { useTagsStore } from "@/src/stores/tagsStore";
import { theme } from "@/src/constants/theme";

const COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Orange", value: "#f97316" },
  { name: "Purple", value: "#8b5cf6" },
];

export function CreateTagModal() {
  const visible = useUiStore((s) => s.showCreateTag);
  const setVisible = useUiStore((s) => s.setShowCreateTag);
  const actionFolder = useUiStore((s) => s.actionFolder);
  const actionFile = useUiStore((s) => s.actionFile);

  const tags = useTagsStore((s) => s.tags);
  const fileTags = useTagsStore((s) => s.fileTags);
  const addTag = useTagsStore((s) => s.addTag);
  const assignTag = useTagsStore((s) => s.assignTag);
  const unassignTag = useTagsStore((s) => s.unassignTag);

  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[1]); // Default Blue

  const target = actionFolder ?? actionFile;
  const currentPath = target?.path ?? "";
  const assignedToCurrent = fileTags[currentPath] ?? [];

  const close = () => {
    setNewTagName("");
    setVisible(false);
  };

  const handleToggleTag = async (tagName: string) => {
    if (!currentPath) return;
    if (assignedToCurrent.includes(tagName)) {
      await unassignTag(currentPath, tagName);
    } else {
      await assignTag(currentPath, tagName);
    }
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    // Embed the color in the tag string: "Name::#Color"
    const tagString = `${name}::${selectedColor.value}`;
    await addTag(tagString);
    if (currentPath) {
      await assignTag(currentPath, tagString);
    }
    setNewTagName("");
  };

  // Helper to parse tag display name and color
  const parseTag = (tagStr: string) => {
    const parts = tagStr.split("::");
    return {
      name: parts[0],
      color: parts[1] || theme.colors.accent,
    };
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          pointerEvents="box-none"
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.title}>Tags</Text>
            {target && (
              <Text style={styles.subtitle} numberOfLines={1}>
                Manage tags for "{target.name}"
              </Text>
            )}

            {/* Existing tags list */}
            <ScrollView style={styles.tagList} contentContainerStyle={styles.listContent}>
              <Text style={styles.sectionTitle}>Assign Tags</Text>
              {tags.length === 0 ? (
                <Text style={styles.emptyText}>No tags created yet. Create one below!</Text>
              ) : (
                tags.map((tagStr) => {
                  const { name, color } = parseTag(tagStr);
                  const isAssigned = assignedToCurrent.includes(tagStr);
                  return (
                    <Pressable
                      key={tagStr}
                      style={[styles.tagRow, isAssigned && styles.tagRowActive]}
                      onPress={() => handleToggleTag(tagStr)}
                    >
                      <View style={[styles.colorDot, { backgroundColor: color }]} />
                      <Text style={styles.tagName}>{name}</Text>
                      <View style={[styles.checkbox, isAssigned && styles.checkboxActive]}>
                        {isAssigned && <Ionicons name="checkmark" size={12} color="#fff" />}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.divider} />

            {/* Create new tag section */}
            <View style={styles.createSection}>
              <Text style={styles.sectionTitle}>Create New Tag</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={newTagName}
                  onChangeText={setNewTagName}
                  placeholder="e.g. Finance, Work, Archive"
                  placeholderTextColor={theme.colors.textMuted}
                />
                <Pressable
                  style={[styles.addBtn, !newTagName.trim() && styles.disabled]}
                  onPress={handleCreateTag}
                  disabled={!newTagName.trim()}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </Pressable>
              </View>

              {/* Color selector */}
              <View style={styles.colorsRow}>
                {COLORS.map((col) => {
                  const active = col.value === selectedColor.value;
                  return (
                    <Pressable
                      key={col.value}
                      style={[styles.colorOption, active && styles.colorOptionActive]}
                      onPress={() => setSelectedColor(col)}
                    >
                      <View style={[styles.colorBadge, { backgroundColor: col.value }]} />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Save/Close Button */}
            <Pressable style={styles.closeBtn} onPress={close}>
              <Text style={styles.closeBtnText}>Done</Text>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  flex: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textDark,
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tagList: { maxHeight: 200, paddingHorizontal: 24 },
  listContent: { paddingBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: theme.colors.textMuted, marginBottom: 12 },
  emptyText: { color: theme.colors.textMuted, fontStyle: "italic", fontSize: 13, marginVertical: 8 },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderLight,
    borderRadius: theme.radius.md,
  },
  tagRowActive: { backgroundColor: theme.colors.infoBg },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  tagName: { flex: 1, fontSize: 15, color: theme.colors.text, fontWeight: "500" },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginVertical: 16 },
  createSection: { paddingHorizontal: 24, gap: 12 },
  inputRow: { flexDirection: "row", gap: 12 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: theme.colors.text,
  },
  addBtn: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.6 },
  colorsRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  colorOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionActive: { borderColor: theme.colors.accent },
  colorBadge: { width: 20, height: 20, borderRadius: 10 },
  closeBtn: {
    marginHorizontal: 24,
    marginTop: 24,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.button,
  },
  closeBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
