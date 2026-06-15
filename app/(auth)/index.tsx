/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Redirect } from "expo-router";

export default function AuthIndex() {
  return <Redirect href="/(auth)/splash" />;
}
