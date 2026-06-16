/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Figma node 1:995 — grouped masonry photo grid
 */

import { useMemo, type ReactNode } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import type { KarsaazFile } from "@karsaaz/cloud-api";

const SCREEN_W = Dimensions.get("window").width;
const PAD = 24;
const GAP = 8;
const COL_W = (SCREEN_W - PAD * 2 - GAP) / 2;
const SHORT_H = 140;
const TALL_H = 296;

interface PhotosGalleryProps {
  photos: KarsaazFile[];
  resolveUri: (file: KarsaazFile) => string;
  resolveHeaders: () => Record<string, string>;
  onPressPhoto: (file: KarsaazFile) => void;
}

interface DayGroup {
  key: string;
  monthLabel: string;
  dateLabel: string;
  items: KarsaazFile[];
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function dayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildDayGroups(photos: KarsaazFile[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const photo of photos) {
    const d = photo.lastModified;
    const key = dayKey(d);
    const existing = map.get(key);
    if (existing) {
      existing.items.push(photo);
      continue;
    }
    map.set(key, {
      key,
      monthLabel: monthLabel(d),
      dateLabel: dayLabel(d),
      items: [photo],
    });
  }
  return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
}

function PhotoTile({
  file,
  uri,
  headers,
  height,
  onPress,
}: {
  file: KarsaazFile;
  uri: string;
  headers: Record<string, string>;
  height: number;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tile, { height }]}>
      <Image source={{ uri, headers }} style={styles.tileImage} />
    </Pressable>
  );
}

function DayMasonry({
  items,
  resolveUri,
  resolveHeaders,
  onPressPhoto,
}: {
  items: KarsaazFile[];
  resolveUri: (file: KarsaazFile) => string;
  resolveHeaders: () => Record<string, string>;
  onPressPhoto: (file: KarsaazFile) => void;
}) {
  const headers = resolveHeaders();
  const rows: ReactNode[] = [];
  let i = 0;
  let rowIndex = 0;

  while (i < items.length) {
    const useTallLeft = rowIndex % 2 === 0;
    const left = items[i];
    const rightTop = items[i + 1];
    const rightBottom = items[i + 2];

    if (useTallLeft && left) {
      rows.push(
        <View key={`row-${rowIndex}`} style={styles.row}>
          <PhotoTile
            file={left}
            uri={resolveUri(left)}
            headers={headers}
            height={TALL_H}
            onPress={() => onPressPhoto(left)}
          />
          <View style={styles.rightCol}>
            {rightTop ? (
              <PhotoTile
                file={rightTop}
                uri={resolveUri(rightTop)}
                headers={headers}
                height={SHORT_H}
                onPress={() => onPressPhoto(rightTop)}
              />
            ) : (
              <View style={{ height: SHORT_H }} />
            )}
            {rightBottom ? (
              <PhotoTile
                file={rightBottom}
                uri={resolveUri(rightBottom)}
                headers={headers}
                height={SHORT_H}
                onPress={() => onPressPhoto(rightBottom)}
              />
            ) : null}
          </View>
        </View>
      );
      i += rightBottom ? 3 : rightTop ? 2 : 1;
    } else {
      const a = items[i];
      const b = items[i + 1];
      rows.push(
        <View key={`row-${rowIndex}`} style={styles.row}>
          {a ? (
            <PhotoTile
              file={a}
              uri={resolveUri(a)}
              headers={headers}
              height={TALL_H}
              onPress={() => onPressPhoto(a)}
            />
          ) : null}
          {b ? (
            <PhotoTile
              file={b}
              uri={resolveUri(b)}
              headers={headers}
              height={TALL_H}
              onPress={() => onPressPhoto(b)}
            />
          ) : (
            <View style={{ width: COL_W }} />
          )}
        </View>
      );
      i += b ? 2 : 1;
    }
    rowIndex += 1;
  }

  return <View style={styles.masonry}>{rows}</View>;
}

export function PhotosGallery({
  photos,
  resolveUri,
  resolveHeaders,
  onPressPhoto,
}: PhotosGalleryProps) {
  const groups = useMemo(() => buildDayGroups(photos), [photos]);
  let lastMonth = "";

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {groups.length === 0 ? (
        <Text style={styles.empty}>No photos in your cloud yet</Text>
      ) : (
        groups.map((group) => {
          const showMonth = group.monthLabel !== lastMonth;
          lastMonth = group.monthLabel;
          return (
            <View key={group.key} style={styles.section}>
              {showMonth && <Text style={styles.monthTitle}>{group.monthLabel}</Text>}
              <Text style={styles.dateTitle}>{group.dateLabel}</Text>
              <DayMasonry
                items={group.items}
                resolveUri={resolveUri}
                resolveHeaders={resolveHeaders}
                onPressPhoto={onPressPhoto}
              />
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: PAD, paddingBottom: 120 },
  section: { marginBottom: 28 },
  monthTitle: {
    fontSize: 24,
    color: "#09090b",
    marginBottom: 4,
    fontWeight: "600",
  },
  dateTitle: {
    fontSize: 14,
    color: "#71717b",
    marginBottom: 12,
  },
  masonry: { gap: GAP },
  row: { flexDirection: "row", gap: GAP },
  rightCol: { width: COL_W, gap: GAP },
  tile: {
    width: COL_W,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f4f4f5",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  tileImage: { width: "100%", height: "100%", resizeMode: "cover" },
  empty: {
    textAlign: "center",
    color: "#71717b",
    marginTop: 40,
    fontSize: 14,
  },
});