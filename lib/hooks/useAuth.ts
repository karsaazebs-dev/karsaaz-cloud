"use client";

import { useSession } from "next-auth/react";

type SessionData = { basicAuth?: string; username?: string } & Record<string, unknown>;

export function useAuth() {
  const { data: session } = useSession();
  const s = session as SessionData | null;
  return {
    basicAuth: (s?.basicAuth as string | undefined) ?? "",
    username: (s?.username as string | undefined) ?? "",
  };
}
