/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useActivity } from "@/src/hooks/useActivity";
import { theme } from "@/src/constants/theme";

export default function ActivityScreen() {
  const { data, isLoading } = useActivity();

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Text style={styles.title}>Activities</Text>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => String(item.activity_id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.user.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.body}>
                <View style={styles.row}>
                  <Text style={styles.user}>{item.user}</Text>
                  <Text style={styles.time}>
                    {new Date(item.datetime).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <Text style={styles.message}>{item.message || item.subject}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No recent activity</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.surface },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.screen,
    paddingVertical: 12,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingHorizontal: theme.spacing.screen, paddingBottom: 120 },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 14,
    marginBottom: 10,
    ...theme.shadow.card,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.infoBg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "600", color: theme.colors.accent },
  body: { flex: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  user: { fontSize: 14, fontWeight: "600", color: theme.colors.text },
  time: { fontSize: 12, color: theme.colors.textMuted },
  message: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
  empty: { textAlign: "center", color: theme.colors.textMuted, marginTop: 40 },
});
