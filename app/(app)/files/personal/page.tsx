"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useFiles, useFileActions } from "@/lib/hooks/useFiles";
import { FileList } from "@/components/files/FileList";
import { FileGrid } from "@/components/files/FileGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/lib/stores/ui.store";
import { buildFilePath } from "@/lib/utils/files";
import { FolderLock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { KarsaazFile } from "@/lib/types/file.types";

type SessionData = { username?: string } & Record<string, unknown>;

export default function PersonalFilesPage() {
  const { data: session } = useSession();
  const username = (session as SessionData | null)?.username as string | undefined;
  const { fileViewMode } = useUIStore();

  const davPath = username ? buildFilePath(username, "/") : "";
  const { data: filesRaw, isLoading, error } = useFiles(davPath);
  const actions = useFileActions(davPath);

  // Personal files = items you own, excluding things shared *with* you.
  const files = useMemo(
    () =>
      (filesRaw ?? []).filter((f) => !f.ownerId || f.ownerId === username),
    [filesRaw, username]
  );

  function handleNavigate(file: KarsaazFile) {
    if (file.type === "directory") {
      window.location.href = `/files?path=${encodeURIComponent(file.path)}`;
    } else {
      window.open(`/api/proxy/remote.php/dav${file.path}`, "_blank");
    }
  }

  function handleAction(action: string, file: KarsaazFile) {
    if (action === "favorite") {
      actions.toggleFavorite.mutate({ filePath: file.path, favorite: !file.isFavorite });
    } else if (action === "download") {
      window.open(`/api/proxy/remote.php/dav${file.path}`, "_blank");
    } else {
      toast.info("Open the file's folder in Files to manage it");
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <FolderLock className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Personal files</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Files you own — items shared with you are hidden here
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
            <AlertTriangle className="h-8 w-8" />
            <p className="text-sm">Failed to load files</p>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
            <FolderLock className="h-12 w-12 opacity-20" />
            <p className="text-sm font-medium">No personal files</p>
          </div>
        ) : fileViewMode === "grid" ? (
          <div className="p-4">
            <FileGrid files={files} onNavigate={handleNavigate} onAction={handleAction} />
          </div>
        ) : (
          <FileList files={files} onNavigate={handleNavigate} onAction={handleAction} />
        )}
      </div>
    </div>
  );
}
