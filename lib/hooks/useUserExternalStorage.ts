"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  listUserStorages,
  createUserStorage,
  deleteUserStorage,
} from "@/lib/api/userExternalStorage";
import type { CreateExternalStoragePayload } from "@/lib/api/externalStorage";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

const KEY = ["user-external-storages"] as const;

export function useUserStorages() {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: KEY,
    queryFn: () => listUserStorages({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 30_000,
  });
}

export function useCreateUserStorage() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExternalStoragePayload) =>
      createUserStorage({ basicAuth: basicAuth! }, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("External storage added");
    },
    onError: (err) => {
      // Personal mounting can be disabled by the admin → POST returns 403.
      if (err instanceof ApiError && err.isForbidden) {
        toast.error("Mounting personal storage is disabled by your administrator");
      } else {
        toast.error("Could not add external storage");
      }
    },
  });
}

export function useDeleteUserStorage() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUserStorage({ basicAuth: basicAuth! }, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("External storage removed");
    },
    onError: () => toast.error("Could not remove external storage"),
  });
}
