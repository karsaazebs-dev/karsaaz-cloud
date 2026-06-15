/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/src/constants/theme";

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  onToggleSecure?: () => void;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "url" | "email-address";
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  onToggleSecure,
  leftIcon,
  autoCapitalize = "none",
  keyboardType = "default",
}: TextFieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            <Ionicons name={leftIcon} size={16} color={theme.colors.accent} />
          </View>
        )}
        <TextInput
          style={[styles.input, leftIcon && styles.inputWithIcon]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(10,10,10,0.3)"
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
        />
        {onToggleSecure && (
          <Pressable onPress={onToggleSecure} style={styles.rightIcon}>
            <Ionicons
              name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
              size={16}
              color={theme.colors.accent}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: {
    fontSize: theme.typography.bodySm.fontSize,
    color: theme.colors.textDark,
    lineHeight: theme.typography.bodySm.lineHeight,
  },
  inputWrap: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.01)",
    minHeight: 56,
    justifyContent: "center",
    ...theme.shadow.button,
  },
  input: {
    paddingHorizontal: 17,
    fontSize: 14,
    color: theme.colors.textDark,
  },
  inputWithIcon: { paddingLeft: 48 },
  leftIcon: {
    position: "absolute",
    left: 12,
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  rightIcon: {
    position: "absolute",
    right: 12,
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
