"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  setMailSettings,
  setMailCredentials,
  sendTestMail,
  getBackgroundJobsMode,
  type MailSettingsPayload,
  type MailCredentialsPayload,
} from "@/lib/api/serverSettings";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

/** Read the configured background-jobs cron mode. */
export function useBackgroundJobsMode() {
  const basicAuth = useBasicAuth();
  return useQuery({
    queryKey: ["background-jobs-mode"],
    queryFn: () => getBackgroundJobsMode({ basicAuth: basicAuth! }),
    enabled: !!basicAuth,
    staleTime: 60_000,
  });
}

interface SaveMailVars {
  settings: MailSettingsPayload;
  /** Credentials are only stored when SMTP auth is enabled. */
  credentials?: MailCredentialsPayload;
}

export function useSetMailSettings() {
  const basicAuth = useBasicAuth();
  return useMutation<void, Error, SaveMailVars>({
    mutationFn: async ({ settings, credentials }) => {
      await setMailSettings({ basicAuth: basicAuth! }, settings);
      if (credentials) {
        await setMailCredentials({ basicAuth: basicAuth! }, credentials);
      }
    },
    onSuccess: () => toast.success("Email settings saved"),
    onError: () => toast.error("Could not save email settings"),
  });
}

export function useSendTestMail() {
  const basicAuth = useBasicAuth();
  return useMutation<void, Error, void>({
    mutationFn: () => sendTestMail({ basicAuth: basicAuth! }),
    onSuccess: () => toast.success("Test email sent — check your inbox"),
    onError: () =>
      toast.error(
        "Could not send test email. Verify the settings and your account email."
      ),
  });
}
