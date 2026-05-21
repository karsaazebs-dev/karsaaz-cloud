"use client";

import { FileIcon } from "@/components/files/FileIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentFiles } from "@/lib/hooks/useDashboard";
import { formatFileDate, formatFileSize } from "@/lib/utils/files";
import { ExternalLink } from "lucide-react";

export function RecentFilesWidget() {
  const { data: files, isLoading } = useRecentFiles(8);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-7 w-7 rounded" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground text-sm">
        <p>No recent files</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors group"
        >
          <FileIcon file={file} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileDate(file.lastModified)} · {formatFileSize(file.size)}
            </p>
          </div>
          <a
            href={`/api/proxy/remote.php/dav${file.path}`}
            target="_blank"
            rel="noreferrer"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            title="Download"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ))}
    </div>
  );
}
