"use client";

import { useQuota } from "@/lib/hooks/useDashboard";
import { useRecentFiles } from "@/lib/hooks/useDashboard";
import { formatFileSize } from "@/lib/utils/files";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive, FolderOpen } from "lucide-react";

export function StorageSettings() {
  const { data: quota, isLoading: loadingQuota } = useQuota();
  const { data: recent } = useRecentFiles(5);

  const used = quota?.used ?? 0;
  const total = quota?.total ?? 0;
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const isUnlimited = !quota || total < 0 || (quota.quota ?? 0) < 0;

  const barColor =
    pct > 90 ? "bg-destructive" : pct > 75 ? "bg-orange-500" : "bg-primary";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Storage</h2>
        <p className="text-sm text-muted-foreground">Your storage usage and recent files</p>
      </div>

      {/* Quota card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Storage Quota
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingQuota ? (
            <>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-1/3" />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{formatFileSize(used)} used</span>
                <span className="text-muted-foreground">
                  {isUnlimited ? "Unlimited storage" : `of ${formatFileSize(total)}`}
                </span>
              </div>
              {!isUnlimited && (
                <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-sm font-semibold">{formatFileSize(used)}</p>
                  <p className="text-xs text-muted-foreground">Used</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-sm font-semibold">
                    {isUnlimited ? "∞" : formatFileSize(quota?.free ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Free</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-sm font-semibold">
                    {isUnlimited ? "∞" : formatFileSize(total)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent files */}
      {recent && recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Recently Modified
            </CardTitle>
            <CardDescription>Your 5 most recently changed files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recent.map((f) => (
                <div key={f.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-muted-foreground max-w-[70%]">{f.path}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatFileSize(f.size)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
