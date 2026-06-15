/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useEffect } from "react";
import { FileBrowserScreen } from "@/src/components/files/FileBrowserScreen";
import { debugLog } from "@/src/utils/debugLog";

export default function FavoritesScreen() {
  useEffect(() => {
    debugLog("favorites.tsx:mount", "favorites tab mounted", { screen: "FavoritesScreen" }, "C");
  }, []);
  return <FileBrowserScreen title="Favorites" filter="favorites" />;
}
