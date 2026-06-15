/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listTrash, listVersions, restoreTrashItem } from "@karsaaz/cloud-api";
import { useAuthStore } from "../stores/authStore";

export function useTrash() {
  const { basicAuth } = useAuthStore();
  const queryClient = useQueryClient();

  const trashQuery = useQuery({
    queryKey: ["trash"],
    queryFn: () => listTrash({ basicAuth }),
    enabled: Boolean(basicAuth),
  });

  const restoreMutation = useMutation({
    mutationFn: (trashId: number) => restoreTrashItem({ basicAuth }, trashId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trash"] }),
  });

  return { trashQuery, restoreMutation };
}

export function useVersions(fileId: number | null) {
  const { basicAuth } = useAuthStore();
  return useQuery({
    queryKey: ["versions", fileId],
    queryFn: () => listVersions({ basicAuth }, fileId!),
    enabled: Boolean(basicAuth && fileId),
  });
}
