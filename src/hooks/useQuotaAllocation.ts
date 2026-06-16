/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authStore";
import {
  getPool,
  getManagedUsers,
  allocateQuota,
  getQuotaRequests,
  createQuotaRequest,
  reviewQuotaRequest,
} from "../api/quotaAllocation";

function useAuthParams() {
  const serverUrl = useAuthStore((s) => s.serverUrl);
  const basicAuth = useAuthStore((s) => s.basicAuth);
  return { serverUrl, basicAuth, enabled: Boolean(basicAuth) };
}

// ── Pool info (for admins) ────────────────────────────────────────────────────

export function usePool() {
  const { serverUrl, basicAuth, enabled } = useAuthParams();
  return useQuery({
    queryKey: ["quota-pool"],
    queryFn: () => getPool(serverUrl, basicAuth),
    enabled,
    staleTime: 30_000,
  });
}

// ── Managed users list (for admins) ──────────────────────────────────────────

export function useManagedUsers() {
  const { serverUrl, basicAuth, enabled } = useAuthParams();
  return useQuery({
    queryKey: ["quota-managed-users"],
    queryFn: () => getManagedUsers(serverUrl, basicAuth),
    enabled,
    staleTime: 30_000,
  });
}

// ── Allocate quota to a user ──────────────────────────────────────────────────

export function useAllocateMutation() {
  const { serverUrl, basicAuth } = useAuthParams();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, bytes }: { uid: string; bytes: number }) =>
      allocateQuota(serverUrl, basicAuth, uid, bytes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quota-pool"] });
      qc.invalidateQueries({ queryKey: ["quota-managed-users"] });
    },
  });
}

// ── Storage requests ──────────────────────────────────────────────────────────

export function useQuotaRequests() {
  const { serverUrl, basicAuth, enabled } = useAuthParams();
  return useQuery({
    queryKey: ["quota-requests"],
    queryFn: () => getQuotaRequests(serverUrl, basicAuth),
    enabled,
    staleTime: 15_000,
  });
}

export function useCreateRequestMutation() {
  const { serverUrl, basicAuth } = useAuthParams();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      currentBytes,
      requestedBytes,
      reason,
    }: {
      currentBytes: number;
      requestedBytes: number;
      reason: string;
    }) => createQuotaRequest(serverUrl, basicAuth, currentBytes, requestedBytes, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quota-requests"] }),
  });
}

export function useReviewRequestMutation() {
  const { serverUrl, basicAuth } = useAuthParams();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      reviewQuotaRequest(serverUrl, basicAuth, id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quota-requests"] });
      qc.invalidateQueries({ queryKey: ["quota-managed-users"] });
      qc.invalidateQueries({ queryKey: ["quota-pool"] });
    },
  });
}
