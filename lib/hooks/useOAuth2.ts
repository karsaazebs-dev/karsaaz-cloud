"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  listOAuth2Clients,
  createOAuth2Client,
  deleteOAuth2Client,
  type OAuth2Client,
} from "@/lib/api/oauth2";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

const KEY = ["oauth2-clients"] as const;

export function useOAuth2Clients() {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: KEY,
    queryFn: () => listOAuth2Clients({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 60_000,
  });
}

export function useCreateOAuth2Client() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation<OAuth2Client, Error, { name: string; redirectUri: string }>({
    mutationFn: ({ name, redirectUri }) =>
      createOAuth2Client({ basicAuth: basicAuth! }, name, redirectUri),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: () => toast.error("Could not create client (check the redirect URL is a full URL)"),
  });
}

export function useDeleteOAuth2Client() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteOAuth2Client({ basicAuth: basicAuth! }, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Client removed");
    },
    onError: () => toast.error("Could not remove client"),
  });
}
