"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/useAuth";
import { apiFetch } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, AlertTriangle, Info, Bug, AlertCircle } from "lucide-react";
import { formatFileDate } from "@/lib/utils/files";

interface LogEntry {
  reqId: string;
  level: number;
  time: string;
  remoteAddr: string;
  user: string;
  app: string;
  method: string;
  url: string;
  message: string;
  userAgent?: string;
  version?: string;
}

const LEVELS: Record<number, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  0: { label: "Debug", icon: <Bug className="h-3 w-3" />, variant: "secondary" },
  1: { label: "Info", icon: <Info className="h-3 w-3" />, variant: "default" },
  2: { label: "Warn", icon: <AlertTriangle className="h-3 w-3" />, variant: "outline" },
  3: { label: "Error", icon: <AlertCircle className="h-3 w-3" />, variant: "destructive" },
  4: { label: "Fatal", icon: <AlertCircle className="h-3 w-3" />, variant: "destructive" },
};

export default function AdminLogsPage() {
  const { basicAuth } = useAuth();
  const [query, setQuery] = useState("");
  const [minLevel, setMinLevel] = useState(1);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: () =>
      apiFetch<{ data: LogEntry[] }>(
        "/index.php/settings/ajax/getlog.php?offset=0&count=100&format=json",
        { basicAuth }
      ),
    enabled: !!basicAuth,
    select: (res) => res?.data ?? (Array.isArray(res) ? (res as LogEntry[]) : []),
    staleTime: 30_000,
  });

  const logs: LogEntry[] = (data as unknown as LogEntry[]) ?? [];

  const filtered = logs.filter((l) => {
    if (l.level < minLevel) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        l.message?.toLowerCase().includes(q) ||
        l.app?.toLowerCase().includes(q) ||
        l.user?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Logs</h1>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input
          className="max-w-xs"
          placeholder="Filter by message, app, user…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="border rounded-md px-3 py-2 text-sm bg-background"
          value={minLevel}
          onChange={(e) => setMinLevel(Number(e.target.value))}
        >
          <option value={0}>All levels</option>
          <option value={1}>Info+</option>
          <option value={2}>Warn+</option>
          <option value={3}>Error+</option>
        </select>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Level</th>
              <th className="text-left px-3 py-2 font-medium">Time</th>
              <th className="text-left px-3 py-2 font-medium">App</th>
              <th className="text-left px-3 py-2 font-medium">User</th>
              <th className="text-left px-3 py-2 font-medium">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y font-mono">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-3 py-2"><Skeleton className="h-3 w-20" /></td>
                  ))}
                </tr>
              ))}
            {filtered.map((l, i) => {
              const level = LEVELS[l.level] ?? LEVELS[1];
              return (
                <tr key={`${l.reqId}-${i}`} className="hover:bg-muted/20">
                  <td className="px-3 py-1.5">
                    <Badge variant={level.variant} className="gap-1">
                      {level.icon}{level.label}
                    </Badge>
                  </td>
                  <td className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">
                    {l.time
                      ? formatFileDate(l.time)
                      : "—"}
                  </td>
                  <td className="px-3 py-1.5 whitespace-nowrap">{l.app || "—"}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">{l.user || "—"}</td>
                  <td className="px-3 py-1.5 max-w-md truncate">{l.message}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No log entries found</div>
        )}
      </div>
    </div>
  );
}
