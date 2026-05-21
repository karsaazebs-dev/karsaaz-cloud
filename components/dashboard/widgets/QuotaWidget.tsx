"use client";

import { HardDrive } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuota } from "@/lib/hooks/useDashboard";
import { formatFileSize } from "@/lib/utils/files";

export function QuotaWidget() {
  const { data: quota, isLoading } = useQuota();

  if (isLoading) {
    return (
      <div className="space-y-3 p-1">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    );
  }

  if (!quota) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <HardDrive className="h-4 w-4" />
        <span>Quota unavailable</span>
      </div>
    );
  }

  const used = quota.used ?? 0;
  const total = quota.total;
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const isUnlimited = total < 0 || quota.quota < 0;

  const barColor =
    pct > 90 ? "bg-destructive" : pct > 75 ? "bg-orange-500" : "bg-primary";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{formatFileSize(used)} used</span>
        <span className="text-muted-foreground">
          {isUnlimited ? "Unlimited" : `of ${formatFileSize(total)}`}
        </span>
      </div>

      {!isUnlimited && (
        <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {isUnlimited ? (
          <span>{formatFileSize(used)} stored</span>
        ) : (
          <>
            <span>{pct.toFixed(1)}% used</span>
            <span>{formatFileSize(quota.free)} free</span>
          </>
        )}
      </div>
    </div>
  );
}
