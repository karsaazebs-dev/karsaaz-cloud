"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useSharedWithMe } from "@/lib/hooks/useDashboard";
import { formatFileDate } from "@/lib/utils/files";
import { Share2, FileIcon as FileIconLucide } from "lucide-react";

export function SharedWithMeWidget() {
  const { data: shares, isLoading } = useSharedWithMe();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-7 w-7 rounded" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!shares || shares.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground text-sm">
        <Share2 className="h-8 w-8 mb-2 opacity-30" />
        <p>Nothing shared with you yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {shares.slice(0, 8).map((share) => (
        <div
          key={share.id}
          className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors"
        >
          <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
            <FileIconLucide className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {share.path.split("/").pop() ?? share.path}
            </p>
            <p className="text-xs text-muted-foreground">
              Shared by {share.displayname_owner} ·{" "}
              {formatFileDate(new Date(share.stime * 1000))}
            </p>
          </div>
        </div>
      ))}
      {shares.length > 8 && (
        <Link
          href="/files/shared"
          className="block text-xs text-primary hover:underline px-2 pt-1"
        >
          +{shares.length - 8} more
        </Link>
      )}
    </div>
  );
}
