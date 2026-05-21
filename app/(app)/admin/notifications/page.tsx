"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Check, X } from "lucide-react";
import { useSettingsPageState } from "@/lib/hooks/useSettingsPageState";

// The notifications admin page exposes its current configuration via the
// server-injected `initial-state-notifications-config` entry (base64 JSON).
// Confirmed live shape: { setting: "admin", setting_batchtime: number,
// sound_notification: boolean, sound_talk: boolean }.
//
// These are admin-level *defaults*; the write path is the notifications app's
// own settings controller, which is not exposed as a confirmed JSON endpoint
// here, so this page is read-only (no POST is fabricated).
const PAGE = "/index.php/settings/admin/notifications";
const ID = "notifications-config";

interface NotificationsConfig {
  setting?: string;
  setting_batchtime?: number;
  sound_notification?: boolean;
  sound_talk?: boolean;
}

function BoolBadge({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
      <Check className="h-3.5 w-3.5" /> Enabled
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <X className="h-3.5 w-3.5" /> Disabled
    </span>
  );
}

export default function AdminNotificationsPage() {
  const { data, isLoading } = useSettingsPageState<NotificationsConfig>(
    ID,
    PAGE
  );

  function batchLabel(v: number | undefined): string {
    if (v === undefined) return "—";
    if (v === 0) return "Send immediately";
    const hours = Math.round(v / 3600);
    return hours >= 1 ? `Every ${hours} hour${hours > 1 ? "s" : ""}` : `${v}s`;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground text-sm">
          Default notification behaviour for this instance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            Default settings
          </CardTitle>
          <CardDescription>
            Current admin defaults reported by the notifications app. Read-only.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3"
              >
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))
          ) : !data ? (
            <p className="py-3 text-sm text-muted-foreground">
              Notification configuration is unavailable.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Batch email digest</p>
                  <p className="text-xs text-muted-foreground">
                    How often queued notification emails are sent.
                  </p>
                </div>
                <span className="text-sm shrink-0">
                  {batchLabel(data.setting_batchtime)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Notification sound</p>
                  <p className="text-xs text-muted-foreground">
                    Play a sound for general notifications.
                  </p>
                </div>
                <BoolBadge on={!!data.sound_notification} />
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Talk sound</p>
                  <p className="text-xs text-muted-foreground">
                    Play a sound for Talk call and chat notifications.
                  </p>
                </div>
                <BoolBadge on={!!data.sound_talk} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
