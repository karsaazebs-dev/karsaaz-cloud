"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Boxes, Server } from "lucide-react";
import { useSettingsPageState } from "@/lib/hooks/useSettingsPageState";

// Read-only: the AppAPI admin page exposes its data via the server-injected
// `initial-state-app_api-admin-initial-data` entry (base64 JSON). Confirmed
// live shape: { daemons: [], default_daemon_config, init_timeout,
// container_restart_policy }. ExApps are not part of this payload on this
// instance, so we render the deploy-daemon list (empty by default).
const PAGE = "/index.php/settings/admin/app_api";
const ID = "app_api-admin-initial-data";

interface Daemon {
  id?: number;
  name?: string;
  display_name?: string;
  accepts_deploy_id?: string;
  protocol?: string;
  host?: string;
}

interface AppApiInitialData {
  daemons?: Daemon[];
  default_daemon_config?: string;
  init_timeout?: string;
  container_restart_policy?: string;
}

export default function AdminAppApiPage() {
  const { data, isLoading } = useSettingsPageState<AppApiInitialData>(ID, PAGE);

  const daemons = data?.daemons ?? [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">AppAPI</h1>
        <p className="text-muted-foreground text-sm">
          Manage external applications and the deploy daemons that run them.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4" />
            Deploy daemons
          </CardTitle>
          <CardDescription>
            Backends (such as Docker) that host external applications. Read-only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : daemons.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No deploy daemons registered.
            </p>
          ) : (
            <div className="space-y-2">
              {daemons.map((d, i) => (
                <div
                  key={d.id ?? d.name ?? i}
                  className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <Boxes className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {d.display_name || d.name || `Daemon ${i + 1}`}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[d.accepts_deploy_id, d.protocol, d.host]
                        .filter(Boolean)
                        .join(" · ") || "No connection details"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data && (
            <dl className="mt-4 border-t pt-4 grid grid-cols-2 gap-y-2 text-xs">
              <dt className="text-muted-foreground">Default daemon</dt>
              <dd className="text-right">
                {data.default_daemon_config || "—"}
              </dd>
              <dt className="text-muted-foreground">Init timeout</dt>
              <dd className="text-right">
                {data.init_timeout ? `${data.init_timeout}s` : "—"}
              </dd>
              <dt className="text-muted-foreground">Container restart policy</dt>
              <dd className="text-right">
                {data.container_restart_policy || "—"}
              </dd>
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Boxes className="h-4 w-4" />
            External apps
          </CardTitle>
          <CardDescription>
            Applications deployed through AppAPI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No external apps registered.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
