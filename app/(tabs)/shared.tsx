/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useEffect } from "react";
import { FileBrowserScreen } from "@/src/components/files/FileBrowserScreen";
import { useUiStore } from "@/src/stores/uiStore";
import { debugLog } from "@/src/utils/debugLog";

const SEARCH_TITLES = {
  all: "All files",
  recent: "Recent files",
  personal: "Personal files",
  favorites: "Favorites",
} as const;

export default function SearchScreen() {
  const browseFilter = useUiStore((s) => s.browseFilter);
  const filter = browseFilter === "personal" ? "all" : browseFilter;
  const title = SEARCH_TITLES[filter];

  useEffect(() => {
    debugLog(
      "shared.tsx:mount",
      "search tab mounted",
      { screen: "SearchScreen", browseFilter, filter, title },
      "C",
      "post-fix"
    );
  }, [browseFilter, filter, title]);

  return <FileBrowserScreen title={title} filter={filter} />;
}
