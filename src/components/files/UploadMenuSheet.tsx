/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { View, Text, Pressable, StyleSheet, Modal, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUiStore } from "@/src/stores/uiStore";
import { figmaAssets } from "@/src/constants/assets";
import { theme } from "@/src/constants/theme";

interface UploadMenuSheetProps {
  onUpload: () => void;
  onCreateFolder: () => void;
  onTakePhoto: () => void;
}

const UPLOAD_OPTIONS = [
  { id: "upload", label: "Upload Files", icon: figmaAssets.createNew.upload },
  { id: "other", label: "Upload From Other Apps", icon: figmaAssets.createNew.uploadOther },
  { id: "camera", label: "Upload From Camera", icon: figmaAssets.createNew.camera },
];

const CREATE_OPTIONS = [
  { id: "folder", label: "Create New Folder", icon: figmaAssets.createNew.folder },
  { id: "doc", label: "New Document", icon: figmaAssets.createNew.doc },
  { id: "sheet", label: "New Spreadsheet", icon: figmaAssets.createNew.spreadsheet },
  { id: "ppt", label: "New Presentation", icon: figmaAssets.createNew.presentation },
  { id: "text", label: "New Text Document", icon: figmaAssets.createNew.textDoc },
];

export function UploadMenuSheet({
  onUpload,
  onCreateFolder,
  onTakePhoto,
}: UploadMenuSheetProps) {
  const visible = useUiStore((s) => s.showUploadMenu);
  const setVisible = useUiStore((s) => s.setShowUploadMenu);

  const run = (action: string) => {
    setVisible(false);
    if (action === "upload" || action === "other") onUpload();
    if (action === "camera") onTakePhoto();
    if (action === "folder") onCreateFolder();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
      <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Create New</Text>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {UPLOAD_OPTIONS.map((option) => (
              <Pressable key={option.id} style={styles.row} onPress={() => run(option.id)}>
                <Image source={option.icon} style={styles.rowIcon} />
                <Text style={styles.label}>{option.label}</Text>
              </Pressable>
            ))}
            <View style={styles.divider} />
            {CREATE_OPTIONS.map((option) => (
              <Pressable key={option.id} style={styles.row} onPress={() => run(option.id)}>
                <Image source={option.icon} style={styles.rowIcon} />
                <Text style={styles.label}>{option.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
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
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    paddingTop: 8,
    maxHeight: "72%",
  },
  handle: {
    width: 30,
    height: 6,
    borderRadius: 4,
    backgroundColor: "rgba(34,34,34,0.72)",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    color: theme.colors.textDark,
    fontWeight: "400",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  scroll: { paddingHorizontal: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
  },
  rowIcon: { width: 22, height: 22, resizeMode: "contain" },
  label: { fontSize: 16, color: theme.colors.textDark, fontWeight: "300" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.borderLight,
    marginVertical: 8,
  },
});
