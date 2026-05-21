"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  listAuthTokens,
  createAuthToken,
  deleteAuthToken,
  type CreatedAuthToken,
} from "@/lib/api/authTokens";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

const KEY = ["auth-tokens"] as const;

export function useAuthTokens() {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: KEY,
    queryFn: () => listAuthTokens({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 30_000,
  });
}

export function useCreateAuthToken() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation<CreatedAuthToken, Error, string>({
    mutationFn: (name: string) => createAuthToken({ basicAuth: basicAuth! }, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: () =>
      toast.error(
        "Could not create app password. This may require logging in with your account password."
      ),
  });
}

export function useDeleteAuthToken() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAuthToken({ basicAuth: basicAuth! }, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Device revoked");
    },
    onError: () => toast.error("Could not revoke device"),
  });
}
