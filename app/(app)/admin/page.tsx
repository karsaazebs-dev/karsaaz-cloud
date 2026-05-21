"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/useAuth";
import { getCapabilities, listUsers, listGroups } from "@/lib/api/ocs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UsersRound, HardDrive, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type NCSys = {
  version?: string;
  php_version?: string;
  phpversion?: string;
  database_type?: string;
  databasetype?: string;
  database_version?: string;
  databaseversion?: string;
  os?: string;
  opsys?: string;
};

export default function AdminOverviewPage() {
  const { basicAuth } = useAuth();
  const opts = { basicAuth };

  const { data: capsData } = useQuery({
    queryKey: ["capabilities"],
    queryFn: () => getCapabilities(opts),
    enabled: !!basicAuth,
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users", "all"],
    queryFn: () => listUsers(opts, { limit: 500 }),
    enabled: !!basicAuth,
  });

  const { data: groups } = useQuery({
    queryKey: ["admin-groups"],
    queryFn: () => listGroups(opts),
    enabled: !!basicAuth,
  });

  const sys = (capsData?.capabilities as { nextcloud?: { system?: NCSys } } | undefined)
    ?.nextcloud?.system;
  const version = capsData?.version?.string ?? sys?.version ?? "—";
  const phpVersion = sys?.php_version ?? sys?.phpversion ?? "—";
  const dbType = sys?.database_type ?? sys?.databasetype ?? "—";
  const dbVersion = sys?.database_version ?? sys?.databaseversion ?? "—";
  const osInfo = sys?.os ?? sys?.opsys ?? "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administration</h1>
        <p className="text-muted-foreground text-sm">Overview of your Karsaaz Cloud instance</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<Info className="h-5 w-5 text-primary" />} title="Server Version" value={capsData ? version : undefined} />
        <StatCard icon={<Users className="h-5 w-5 text-primary" />} title="Users" value={users ? String(users.length) : undefined} />
        <StatCard icon={<UsersRound className="h-5 w-5 text-primary" />} title="Groups" value={groups ? String(groups.length) : undefined} />
        <StatCard icon={<HardDrive className="h-5 w-5 text-primary" />} title="PHP Version" value={capsData ? phpVersion : undefined} />
      </div>

      {capsData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <Row label="Product" value="Karsaaz Cloud" />
              <Row label="Version" value={version} />
              <Row label="PHP" value={phpVersion} />
              <Row label="Database" value={dbType} />
              <Row label="Database version" value={dbVersion} />
              <Row label="OS" value={osInfo} />
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, title, value }: { icon: React.ReactNode; title: string; value?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-5 pb-5">
        {icon}
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          {value !== undefined ? (
            <p className="text-lg font-semibold leading-none">{value}</p>
          ) : (
            <Skeleton className="h-5 w-16 mt-1" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </>
  );
}
