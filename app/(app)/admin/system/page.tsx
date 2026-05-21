"use client";

import { useServerInfo } from "@/lib/hooks/useServerInfo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Users,
  Files,
  Activity,
} from "lucide-react";

const DASH = "—";

/** Format a byte count into a human-readable string. */
function formatBytes(bytes?: number | string | null): string {
  if (bytes === undefined || bytes === null || bytes === "") return DASH;
  const n = typeof bytes === "string" ? Number(bytes) : bytes;
  if (!Number.isFinite(n) || n < 0) return DASH;
  if (n === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  const value = n / Math.pow(1024, i);
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatNumber(n?: number | null): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return DASH;
  return n.toLocaleString();
}

export default function AdminSystemPage() {
  const { data, isLoading, isError } = useServerInfo();

  const system = data?.nextcloud?.system;
  const storage = data?.nextcloud?.storage;
  const apps = data?.nextcloud?.apps;
  const server = data?.server;
  const php = server?.php;
  const database = server?.database;
  const activeUsers = data?.activeUsers;

  // Memory values from serverinfo are reported in kilobytes.
  const memTotalBytes =
    system?.mem_total !== undefined ? system.mem_total * 1024 : undefined;
  const memFreeBytes =
    system?.mem_free !== undefined ? system.mem_free * 1024 : undefined;
  const memUsedBytes =
    memTotalBytes !== undefined && memFreeBytes !== undefined
      ? memTotalBytes - memFreeBytes
      : undefined;

  const swapTotalBytes =
    system?.swap_total !== undefined ? system.swap_total * 1024 : undefined;
  const swapFreeBytes =
    system?.swap_free !== undefined ? system.swap_free * 1024 : undefined;
  const swapUsedBytes =
    swapTotalBytes !== undefined && swapFreeBytes !== undefined
      ? swapTotalBytes - swapFreeBytes
      : undefined;

  const cpuload = system?.cpuload;
  const cpuValue =
    Array.isArray(cpuload) && cpuload.length > 0
      ? cpuload.map((l) => l.toFixed(2)).join(" / ")
      : undefined;

  const memValue =
    memUsedBytes !== undefined && memTotalBytes !== undefined
      ? `${formatBytes(memUsedBytes)} / ${formatBytes(memTotalBytes)}`
      : undefined;

  const swapValue =
    swapTotalBytes !== undefined && swapTotalBytes > 0
      ? `${formatBytes(swapUsedBytes)} / ${formatBytes(swapTotalBytes)}`
      : swapTotalBytes === 0
        ? "None"
        : undefined;

  const activeValue =
    activeUsers?.last5minutes !== undefined
      ? formatNumber(activeUsers.last5minutes)
      : undefined;

  const ready = !isLoading && !isError && !!data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System</h1>
        <p className="text-muted-foreground text-sm">
          Live monitoring of your Karsaaz Cloud instance
        </p>
      </div>

      {isError && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Could not load system information.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={<Cpu className="h-5 w-5 text-primary" />}
          title="CPU load (1/5/15m)"
          value={ready ? cpuValue ?? DASH : undefined}
        />
        <StatCard
          icon={<MemoryStick className="h-5 w-5 text-primary" />}
          title="Memory used"
          value={ready ? memValue ?? DASH : undefined}
        />
        <StatCard
          icon={<MemoryStick className="h-5 w-5 text-primary" />}
          title="Swap used"
          value={ready ? swapValue ?? DASH : undefined}
        />
        <StatCard
          icon={<Activity className="h-5 w-5 text-primary" />}
          title="Active users (5m)"
          value={ready ? activeValue ?? DASH : undefined}
        />
        <StatCard
          icon={<Files className="h-5 w-5 text-primary" />}
          title="Files"
          value={ready ? formatNumber(storage?.num_files) : undefined}
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-primary" />}
          title="Users"
          value={ready ? formatNumber(storage?.num_users) : undefined}
        />
      </div>

      {(ready || isLoading) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <Row label="Version" value={system?.version} loading={isLoading} />
                <Row label="Web server" value={server?.webserver} loading={isLoading} />
                <Row label="CPU cores" value={formatNumber(system?.cpunum)} loading={isLoading} />
                <Row label="Free disk space" value={formatBytes(system?.freespace)} loading={isLoading} />
                <Row
                  label="Apps installed"
                  value={apps?.num_installed !== undefined ? formatNumber(apps.num_installed) : DASH}
                  loading={isLoading}
                />
                <Row
                  label="App updates"
                  value={apps?.num_updates_available !== undefined ? formatNumber(apps.num_updates_available) : DASH}
                  loading={isLoading}
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">PHP &amp; database</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <Row label="PHP version" value={php?.version} loading={isLoading} />
                <Row label="PHP memory limit" value={formatBytes(php?.memory_limit)} loading={isLoading} />
                <Row
                  label="Max execution time"
                  value={php?.max_execution_time !== undefined ? `${php.max_execution_time}s` : DASH}
                  loading={isLoading}
                />
                <Row label="Upload max size" value={formatBytes(php?.upload_max_filesize)} loading={isLoading} />
                <Row label="Database" value={database?.type} loading={isLoading} />
                <Row label="Database size" value={formatBytes(database?.size)} loading={isLoading} />
                <Row
                  label="Database version"
                  value={formatDbVersion(database?.version)}
                  loading={isLoading}
                  full
                />
              </dl>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/** Database version strings can be very long; trim to the first line / clause. */
function formatDbVersion(version?: string): string {
  if (!version) return DASH;
  // e.g. "PostgreSQL 16.13 on x86_64-pc-linux-musl, compiled by ..."
  const firstClause = version.split(",")[0].trim();
  return firstClause || version;
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-5 pb-5">
        {icon}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          {value !== undefined ? (
            <p className="text-base font-semibold leading-tight truncate">{value}</p>
          ) : (
            <Skeleton className="h-5 w-16 mt-1" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  loading,
  full,
}: {
  label: string;
  value?: string;
  loading?: boolean;
  full?: boolean;
}) {
  return (
    <>
      <dt className={`text-muted-foreground ${full ? "col-span-2" : ""}`}>{label}</dt>
      <dd className={`font-medium break-words ${full ? "col-span-2" : ""}`}>
        {loading ? <Skeleton className="h-4 w-24" /> : value ?? DASH}
      </dd>
    </>
  );
}
