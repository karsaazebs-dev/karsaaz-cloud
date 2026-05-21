"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActivityPage, ACTIVITY_TYPES } from "@/lib/hooks/useActivity";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatFileDate } from "@/lib/utils/files";
import {
  Activity,
  FilePlus,
  FileEdit,
  Trash2,
  Share2,
  Download,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OCSActivity } from "@/lib/types/ocs.types";

function ActivityIcon({ type }: { type: string }) {
  const cls = "h-4 w-4";
  if (type === "file_created") return <FilePlus className={`${cls} text-green-500`} />;
  if (type === "file_changed") return <FileEdit className={`${cls} text-blue-500`} />;
  if (type === "file_deleted") return <Trash2 className={`${cls} text-red-500`} />;
  if (type.includes("shar")) return <Share2 className={`${cls} text-yellow-500`} />;
  if (type === "downloaded") return <Download className={`${cls} text-purple-500`} />;
  return <Activity className={`${cls} text-muted-foreground`} />;
}

function ActivityItem({ item }: { item: OCSActivity }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
      <div className="mt-0.5 h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <ActivityIcon type={item.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">{item.subject || item.message}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatFileDate(item.timestamp * 1000)}
          </span>
          {item.app && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {item.app}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export function ActivityView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter") || searchParams.get("type") || "all";

  // Map URL parameter to API type
  const apiType = filterParam === "shares" || filterParam === "shared" ? "shared" : filterParam;

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useActivityPage(apiType);

  const allActivities = data?.pages.flatMap((p) => p) ?? [];

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
          <p className="text-sm text-muted-foreground">Your recent actions</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {ACTIVITY_TYPES.map((t) => {
          const filterValue = t.value === "shared" ? "shares" : t.value;
          const isSelected = filterParam === filterValue || (t.value === "all" && !["files", "file_created", "file_changed", "file_deleted", "shares"].includes(filterParam));

          return (
            <button
              key={t.value}
              onClick={() => router.push(`/activity?filter=${filterValue}`)}
              className={cn(
                "px-3 py-1 rounded-full text-sm border transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Activity list */}
      <div className="rounded-xl border bg-card p-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-2.5 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : allActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Activity className="h-10 w-10 mb-3 opacity-20" />
            <p>No activity yet</p>
          </div>
        ) : (
          <div>
            {allActivities.map((item) => (
              <ActivityItem key={item.activity_id} item={item} />
            ))}
            {hasNextPage && (
              <div className="pt-3 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="gap-2"
                >
                  {isFetchingNextPage ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Load more
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
