"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getOutOfOffice,
  setOutOfOffice,
  clearOutOfOffice,
} from "@/lib/api/availability";
import type {
  OutOfOfficeData,
  SetOutOfOfficePayload,
} from "@/lib/api/availability";
import { toast } from "sonner";

type SessionData = { basicAuth?: string; username?: string } & Record<string, unknown>;

function useSessionAuth() {
  const { data: session } = useSession();
  const s = session as SessionData | null;
  return {
    basicAuth: s?.basicAuth as string | undefined,
    username: s?.username as string | undefined,
  };
}

const OUT_OF_OFFICE_KEY = ["out-of-office"] as const;

export function useOutOfOffice() {
  const { basicAuth, username } = useSessionAuth();
  return useQuery({
    queryKey: [...OUT_OF_OFFICE_KEY, username],
    queryFn: () => getOutOfOffice({ basicAuth: basicAuth! }, username!),
    enabled: !!basicAuth && !!username,
    staleTime: 60_000,
  });
}

export function useSetOutOfOffice() {
  const { basicAuth, username } = useSessionAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetOutOfOfficePayload) =>
      setOutOfOffice({ basicAuth: basicAuth! }, username!, payload),
    onSuccess: (data) => {
      qc.setQueryData<OutOfOfficeData | null>(
        [...OUT_OF_OFFICE_KEY, username],
        data
      );
      toast.success("Absence saved");
    },
    onError: () => toast.error("Could not save absence"),
  });
}

export function useClearOutOfOffice() {
  const { basicAuth, username } = useSessionAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clearOutOfOffice({ basicAuth: basicAuth! }, username!),
    onSuccess: () => {
      qc.setQueryData<OutOfOfficeData | null>(
        [...OUT_OF_OFFICE_KEY, username],
        null
      );
      toast.success("Absence cleared");
    },
    onError: () => toast.error("Could not clear absence"),
  });
}

export type { OutOfOfficeData };
