"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  listLdapConfigs,
  createLdapConfig,
  modifyLdapConfig,
  deleteLdapConfig,
  type LdapConfig,
  type LdapConfigInput,
} from "@/lib/api/ldap";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

const KEY = ["ldap-configs"] as const;

export function useLdapConfigs() {
  const basicAuth = useBasicAuth();
  return useQuery<LdapConfig[]>({
    queryKey: KEY,
    queryFn: () => listLdapConfigs({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 60_000,
    retry: false,
  });
}

export function useCreateLdapConfig() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation<string, Error, void>({
    mutationFn: () => createLdapConfig({ basicAuth: basicAuth! }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Configuration created");
    },
    onError: () => toast.error("Could not create configuration"),
  });
}

export function useModifyLdapConfig() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; configData: LdapConfigInput }>({
    mutationFn: ({ id, configData }) =>
      modifyLdapConfig({ basicAuth: basicAuth! }, id, configData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Saved");
    },
    onError: () => toast.error("Could not save configuration"),
  });
}

export function useDeleteLdapConfig() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteLdapConfig({ basicAuth: basicAuth! }, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Configuration removed");
    },
    onError: () => toast.error("Could not remove configuration"),
  });
}
