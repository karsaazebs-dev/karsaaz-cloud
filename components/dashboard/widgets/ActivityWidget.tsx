"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useActivityFeed } from "@/lib/hooks/useDashboard";
import { formatFileDate } from "@/lib/utils/files";
import {
  FilePlus,
  FileEdit,
  Trash2,
  Share2,
  Download,
  Activity,
} from "lucide-react";

function ActivityIcon({ type }: { type: string }) {
  const cls = "h-3.5 w-3.5";
  if (type === "file_created") return <FilePlus className={`${cls} text-green-500`} />;
  if (type === "file_changed") return <FileEdit className={`${cls} text-blue-500`} />;
  if (type === "file_deleted") return <Trash2 className={`${cls} text-red-500`} />;
  if (type === "shared") return <Share2 className={`${cls} text-yellow-500`} />;
  if (type === "downloaded") return <Download className={`${cls} text-purple-500`} />;
  return <Activity className={`${cls} text-muted-foreground`} />;
}

export function ActivityWidget() {
  const { data: activities, isLoading } = useActivityFeed(10);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-6 w-6 rounded-full mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-2.5 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground text-sm">
        <Activity className="h-8 w-8 mb-2 opacity-30" />
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-hidden">
      {activities.map((item) => (
        <div key={item.activity_id} className="flex items-start gap-2.5 text-sm">
          <div className="mt-0.5 h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
            <ActivityIcon type={item.type} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-tight line-clamp-2">
              {item.subject || item.message}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatFileDate(item.timestamp * 1000)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
