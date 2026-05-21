"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAppConfigValues, useSetAppConfigValue } from "@/lib/hooks/useAppConfig";

// Sharing defaults are stored under the `core` app as "yes"/"no" strings.
const APP = "core";

interface ToggleDef {
  key: string;
  label: string;
  description: string;
  /** Value assumed when the key has never been set. */
  defaultOn: boolean;
}

const TOGGLES: ToggleDef[] = [
  { key: "shareapi_enabled", label: "Allow sharing", description: "Master switch for the sharing API.", defaultOn: true },
  { key: "shareapi_allow_links", label: "Allow public link sharing", description: "Let users share files via public links.", defaultOn: true },
  { key: "shareapi_allow_public_upload", label: "Allow public uploads", description: "Let recipients upload into public link shares.", defaultOn: true },
  { key: "shareapi_enable_link_password_by_default", label: "Password protect links by default", description: "Pre-enable password protection on new links.", defaultOn: false },
  { key: "shareapi_enforce_links_password", label: "Enforce password on links", description: "Require a password for every public link.", defaultOn: false },
  { key: "shareapi_allow_resharing", label: "Allow resharing", description: "Let users reshare files shared with them.", defaultOn: true },
  { key: "shareapi_allow_group_sharing", label: "Allow group sharing", description: "Let users share with whole groups.", defaultOn: true },
  { key: "shareapi_default_expire_date", label: "Default link expiration", description: "Set a default expiration date on new links.", defaultOn: false },
  { key: "shareapi_allow_share_dialog_user_enumeration", label: "Username autocompletion", description: "Suggest matching users in the share dialog.", defaultOn: true },
];

const KEYS = TOGGLES.map((t) => t.key);

export default function AdminSharingPage() {
  const { data: values, isLoading } = useAppConfigValues(APP, KEYS);
  const setValue = useSetAppConfigValue(APP);

  function isOn(def: ToggleDef): boolean {
    const v = values?.[def.key];
    if (v === undefined || v === "") return def.defaultOn;
    return v === "yes";
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Sharing</h1>
        <p className="text-muted-foreground text-sm">Control how users can share files and folders.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sharing defaults</CardTitle>
          <CardDescription>These apply instance-wide. Changes take effect immediately.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
              ))
            : TOGGLES.map((def) => (
                <div key={def.key} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{def.label}</p>
                    <p className="text-xs text-muted-foreground">{def.description}</p>
                  </div>
                  <Switch
                    checked={isOn(def)}
                    onCheckedChange={(checked) =>
                      setValue.mutate(
                        { key: def.key, value: checked ? "yes" : "no" },
                        { onSuccess: () => toast.success("Saved") }
                      )
                    }
                    aria-label={def.label}
                  />
                </div>
              ))}
        </CardContent>
      </Card>
    </div>
  );
}
