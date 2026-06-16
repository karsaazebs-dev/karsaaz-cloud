/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@karsaaz/cloud-api";
import { useAuthStore } from "../stores/authStore";

export function useUserQuota() {
  const { basicAuth } = useAuthStore();
  return useQuery({
    queryKey: ["user-quota"],
    queryFn: () => getCurrentUser({ basicAuth }),
    enabled: Boolean(basicAuth),
    staleTime: 60_000,
  });
}
