/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { KarsaazFile } from "@karsaaz/cloud-api";
import type { BrowseFilter, SortOrder } from "@/src/stores/uiStore";

export function filterFiles(
  files: KarsaazFile[],
  filter: BrowseFilter,
  favoritePaths: string[],
  query: string
): KarsaazFile[] {
  let result = [...files];

  if (filter === "recent") {
    result = result
      .filter((f) => f.type === "file")
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      .slice(0, 50);
  } else if (filter === "favorites") {
    result = result.filter((f) => favoritePaths.includes(f.path));
  } else if (filter === "personal") {
    result = result.filter((f) => !f.name.startsWith("."));
  }

  if (query.trim()) {
    const q = query.trim().toLowerCase();
    result = result.filter((f) => f.name.toLowerCase().includes(q));
  }

  return result;
}

export function sortFiles(files: KarsaazFile[], order: SortOrder): KarsaazFile[] {
  const sorted = [...files];
  sorted.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    switch (order) {
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "date-desc":
        return b.lastModified.getTime() - a.lastModified.getTime();
      case "size-desc":
        return (b.size ?? 0) - (a.size ?? 0);
      default:
        return a.name.localeCompare(b.name);
    }
  });
  return sorted;
}

export function formatFileDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfTarget.getTime()) / (24 * 60 * 60 * 1000)
  );
  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return `${dayDiff} days ago`;
  return formatFileDate(date);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 0) return "Unlimited";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
