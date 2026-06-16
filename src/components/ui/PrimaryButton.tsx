/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Pressable, Text, StyleSheet, ActivityIndicator, View, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { figmaAssets } from "@/src/constants/assets";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  showArrow?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  showArrow,
  icon,
}: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={["#4e3cf4", "#2b7fff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.row}>
            {icon && <Ionicons name={icon} size={18} color="#fff" style={styles.icon} />}
            <Text style={styles.label}>{label}</Text>
            {showArrow && (
              <Image source={figmaAssets.login.continueArrow} style={styles.arrowIcon} />
            )}
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  pressed: { opacity: 0.9 },
  gradient: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { marginRight: 2 },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  arrowIcon: { width: 18, height: 18, resizeMode: "contain", tintColor: "#fff" },
});
