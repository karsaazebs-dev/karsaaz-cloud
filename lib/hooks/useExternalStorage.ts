"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  listExternalStorages,
  createExternalStorage,
  deleteExternalStorage,
  type CreateExternalStoragePayload,
} from "@/lib/api/externalStorage";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

const KEY = ["external-storages"] as const;

export function useExternalStorages() {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: KEY,
    queryFn: () => listExternalStorages({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 30_000,
  });
}

export function useCreateExternalStorage() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExternalStoragePayload) =>
      createExternalStorage({ basicAuth: basicAuth! }, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("External storage added");
    },
    onError: () => toast.error("Could not add external storage"),
  });
}

export function useDeleteExternalStorage() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteExternalStorage({ basicAuth: basicAuth! }, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("External storage removed");
    },
    onError: () => toast.error("Could not remove external storage"),
  });
}
