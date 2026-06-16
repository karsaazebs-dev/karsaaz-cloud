/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUiStore } from "@/src/stores/uiStore";
import { theme } from "@/src/constants/theme";

interface FabSheetProps {
  onUpload: () => void;
  onNewFolder: () => void;
}

export function FabSheet({ onUpload, onNewFolder }: FabSheetProps) {
  const visible = useUiStore((s) => s.showFabSheet);
  const setVisible = useUiStore((s) => s.setShowFabSheet);

  const close = () => setVisible(false);

  const handleUpload = () => {
    close();
    onUpload();
  };

  const handleNewFolder = () => {
    close();
    onNewFolder();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Pressable style={styles.option} onPress={handleUpload}>
            <View style={styles.iconWrap}>
              <Ionicons name="cloud-upload-outline" size={22} color={theme.colors.accent} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>Upload File</Text>
              <Text style={styles.optionSub}>Choose a file from your device</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </Pressable>
          <Pressable style={styles.option} onPress={handleNewFolder}>
            <View style={styles.iconWrap}>
              <Ionicons name="folder-open-outline" size={22} color={theme.colors.accent} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>New Folder</Text>
              <Text style={styles.optionSub}>Create a new folder here</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </Pressable>
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
    paddingTop: 8,
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderLight,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.infoBg,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: "600", color: theme.colors.text },
  optionSub: { fontSize: 13, color: theme.colors.textMuted, marginTop: 2 },
});
