"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useActivitySettings,
  useSaveActivitySettings,
} from "@/lib/hooks/useActivitySettings";
import type { ActivityGroup } from "@/lib/api/activitySettings";

/** Strip the backend's <strong> markup from an activity description. */
function plainDesc(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

/** Render the per-user batched-email interval (seconds) as a friendly label. */
function batchtimeLabel(seconds: number): string {
  if (!seconds) return "As soon as possible";
  const hours = Math.round(seconds / 3600);
  if (hours <= 1) return "Hourly";
  if (hours === 24) return "Daily";
  if (hours === 24 * 7) return "Weekly";
  return `Every ${hours} hours`;
}

export default function AdminActivityPage() {
  const { data, isLoading, isError } = useActivitySettings();
  const save = useSaveActivitySettings();

  // Local editable copy so toggles feel instant; resynced when data loads.
  const [groups, setGroups] = useState<ActivityGroup[]>([]);
  useEffect(() => {
    if (data?.groups) setGroups(data.groups);
  }, [data?.groups]);

  const canSave = !!data?.canSave;

  function toggle(
    groupId: string,
    typeId: string,
    field: "email" | "notification",
    value: boolean
  ) {
    const next = groups.map((g) =>
      g.id !== groupId
        ? g
        : {
            ...g,
            types: g.types.map((t) =>
              t.id === typeId ? { ...t, [field]: value } : t
            ),
          }
    );
    setGroups(next);
    save.mutate(next);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-muted-foreground text-sm">
          Choose which activities are sent to users by email and as push
          notifications by default.
        </p>
      </div>

      {!isLoading && data && !data.isEmailSet && (
        <Card className="border-amber-500/40">
          <CardContent className="py-3">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              No email server is configured, so email notifications will not be
              delivered until one is set up.
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="divide-y">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <Skeleton className="h-4 w-56" />
                <div className="flex gap-6">
                  <Skeleton className="h-5 w-9 rounded-full" />
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              Could not load activity settings.
            </p>
          </CardContent>
        </Card>
      ) : !data || groups.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              No activity types are available.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle className="text-base">{group.name}</CardTitle>
                <CardDescription>
                  Default delivery for {group.name.toLowerCase()} activities.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y">
                <div className="flex items-center justify-between gap-4 pb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Activity
                  </span>
                  <div className="flex gap-6 text-xs font-medium text-muted-foreground">
                    <span className="w-9 text-center">
                      {data.methods.email ?? "Mail"}
                    </span>
                    <span className="w-9 text-center">
                      {data.methods.notification ?? "Push"}
                    </span>
                  </div>
                </div>
                {group.types.map((type) => {
                  const supportsEmail = type.methods.includes("email");
                  const supportsNotif = type.methods.includes("notification");
                  return (
                    <div
                      key={type.id}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <p className="min-w-0 text-sm">{plainDesc(type.desc)}</p>
                      <div className="flex gap-6">
                        <div className="w-9 flex justify-center">
                          {supportsEmail ? (
                            <Switch
                              checked={type.email}
                              disabled={!canSave || save.isPending}
                              onCheckedChange={(v) =>
                                toggle(group.id, type.id, "email", v)
                              }
                              aria-label={`${plainDesc(type.desc)} — email`}
                            />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                        <div className="w-9 flex justify-center">
                          {supportsNotif ? (
                            <Switch
                              checked={type.notification}
                              disabled={!canSave || save.isPending}
                              onCheckedChange={(v) =>
                                toggle(group.id, type.id, "notification", v)
                              }
                              aria-label={`${plainDesc(type.desc)} — notification`}
                            />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email batching</CardTitle>
              <CardDescription>
                How often batched activity emails are sent. This is a per-user
                preference and is shown here for reference.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">
                {batchtimeLabel(data.batchtime)}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
