"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/useAuth";
import { getCapabilities } from "@/lib/api/ocs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";

const KNOWN_APPS: Record<string, string> = {
  activity: "Activity",
  admin_notifications: "Admin Notifications",
  cloud_federation_api: "Cloud Federation API",
  comments: "Comments",
  contactsinteraction: "Contacts Interaction",
  dashboard: "Dashboard",
  dav: "CalDAV / CardDAV",
  encryption: "Encryption",
  federatedfilesharing: "Federated File Sharing",
  federation: "Federation",
  files: "Files",
  files_external: "External Storage",
  files_sharing: "File Sharing",
  files_trashbin: "Deleted Files",
  files_versions: "File Versions",
  oauth2: "OAuth 2.0",
  provisioning_api: "Provisioning API",
  settings: "Settings",
  sharebymail: "Share By Mail",
  systemtags: "Collaborative Tags",
  theming: "Theming",
  twofactor_backupcodes: "Two-Factor Backup Codes",
  updatenotification: "Update Notification",
  user_ldap: "LDAP User Integration",
  user_status: "User Status",
  weather_status: "Weather Status",
  workflowengine: "Workflow Engine",
  richdocuments: "Collabora Online",
  richdocumentscode: "Collabora Online (Built-in)",
};

export default function AdminAppsPage() {
  const { basicAuth } = useAuth();
  const { data: caps, isLoading } = useQuery({
    queryKey: ["capabilities"],
    queryFn: () => getCapabilities({ basicAuth }),
    enabled: !!basicAuth,
  });

  const enabledApps = caps?.capabilities ? Object.keys(caps.capabilities) : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Apps</h1>
        <p className="text-muted-foreground text-sm">
          Apps currently enabled on this instance (based on server capabilities)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          Array.from({ length: 9 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 pt-4 pb-4">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        {enabledApps.map((app) => (
          <Card key={app} className="hover:bg-muted/30 transition-colors">
            <CardContent className="flex items-center gap-3 pt-4 pb-4">
              <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {KNOWN_APPS[app] ?? app}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">{app}</p>
              </div>
              <Badge variant="default" className="shrink-0 text-xs">Enabled</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLoading && enabledApps.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No app capabilities detected
        </div>
      )}
    </div>
  );
}
