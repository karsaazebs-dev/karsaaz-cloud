/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useQuery } from "@tanstack/react-query";
import { listActivity } from "@karsaaz/cloud-api";
import { useAuthStore } from "../stores/authStore";

export function useActivity() {
  const { basicAuth } = useAuthStore();
  return useQuery({
    queryKey: ["activity"],
    queryFn: () => listActivity({ basicAuth }),
    enabled: Boolean(basicAuth),
    refetchInterval: 60_000,
  });
}
