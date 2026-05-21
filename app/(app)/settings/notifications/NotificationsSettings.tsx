"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Mail, AlertTriangle } from "lucide-react";
import {
  useNotificationSettings,
  useSaveNotificationSettings,
} from "@/lib/hooks/useActivitySettings";
import type { ActivityGroup } from "@/lib/api/activitySettings";

export function NotificationsSettings() {
  const { data, isLoading, isError } = useNotificationSettings();
  const save = useSaveNotificationSettings();

  // Local editable copy of the groups (toggles update optimistically, then save).
  const [groups, setGroups] = useState<ActivityGroup[]>([]);
  useEffect(() => {
    if (data?.groups) setGroups(data.groups);
  }, [data?.groups]);

  function toggle(
    groupId: string,
    typeId: string,
    method: "email" | "notification",
    value: boolean
  ) {
    const next = groups.map((g) =>
      g.id !== groupId
        ? g
        : {
            ...g,
            types: g.types.map((t) => (t.id === typeId ? { ...t, [method]: value } : t)),
          }
    );
    setGroups(next);
    save.mutate(next);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Choose which activities notify you by email or push.
        </p>
      </div>

      {data && !data.isEmailSet && (
        <div className="flex items-start gap-2 rounded-md bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>No email server is configured, so email notifications will not be delivered.</span>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : isError ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Notification preferences are unavailable.
          </CardContent>
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No notifiable activities available.
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                {group.name}
              </CardTitle>
              <CardDescription className="flex gap-6">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</span>
                <span className="flex items-center gap-1.5"><Bell className="h-3.5 w-3.5" /> Push</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {group.types.map((t) => (
                <div key={t.id} className="flex items-center gap-4 py-2.5">
                  <span className="flex-1 text-sm" dangerouslySetInnerHTML={{ __html: t.desc }} />
                  <div className="flex items-center gap-6 shrink-0">
                    <Switch
                      checked={t.email}
                      disabled={!t.methods.includes("email") || save.isPending}
                      onCheckedChange={(v) => toggle(group.id, t.id, "email", v)}
                      aria-label={`${t.id} email`}
                    />
                    <Switch
                      checked={t.notification}
                      disabled={!t.methods.includes("notification") || save.isPending}
                      onCheckedChange={(v) => toggle(group.id, t.id, "notification", v)}
                      aria-label={`${t.id} push`}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
