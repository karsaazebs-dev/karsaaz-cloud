/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createShare, deleteShare, listShares } from "@karsaaz/cloud-api";
import { useAuthStore } from "../stores/authStore";

export function useSharing(path?: string) {
  const { basicAuth } = useAuthStore();
  const queryClient = useQueryClient();

  const sharesQuery = useQuery({
    queryKey: ["shares", path],
    queryFn: () =>
      listShares(
        { basicAuth },
        path ? { path } : { shared_with_me: true }
      ),
    enabled: Boolean(basicAuth),
  });

  const createMutation = useMutation({
    mutationFn: (params: { path: string; shareType: number; permissions?: number }) =>
      createShare(
        { basicAuth },
        {
          path: params.path,
          shareType: params.shareType,
          permissions: params.permissions ?? 1,
        }
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shares"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (shareId: string) => deleteShare({ basicAuth }, shareId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shares"] }),
  });

  return { sharesQuery, createMutation, deleteMutation };
}
