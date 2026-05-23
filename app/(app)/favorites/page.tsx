"use client";

import { useFavorites } from "@/lib/hooks/useVersionsTrash";
import { useFileActions } from "@/lib/hooks/useFiles";
import { FileList } from "@/components/files/FileList";
import { FileGrid } from "@/components/files/FileGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/lib/stores/ui.store";
import { useSession } from "next-auth/react";
import { buildFilePath, getRelativePath } from "@/lib/utils/files";
import { Star, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { KarsaazFile } from "@/lib/types/file.types";

type SessionData = { username?: string } & Record<string, unknown>;

export default function FavoritesPage() {
  const { data: session } = useSession();
  const username = (session as SessionData | null)?.username as string | undefined;
  const { data: files, isLoading, error } = useFavorites();
  const { fileViewMode } = useUIStore();

  // We need a dummy path for actions — actions will use the file's own path
  const actions = useFileActions(username ? buildFilePath(username, "/") : "");

  function handleNavigate(file: KarsaazFile) {
    if (!username) return;
    const relPath = getRelativePath(username, file.path);
    if (file.type === "directory") {
      window.location.href = `/files?path=${encodeURIComponent(relPath)}`;
    } else {
      window.open(`/api/proxy${buildFilePath(username, relPath)}`, "_blank");
    }
  }

  function handleAction(action: string, file: KarsaazFile) {
    if (!username) return;
    const relPath = getRelativePath(username, file.path);
    if (action === "favorite") {
      actions.toggleFavorite.mutate({ filePath: buildFilePath(username, relPath), favorite: false });
    } else if (action === "download") {
      window.open(`/api/proxy${buildFilePath(username, relPath)}`, "_blank");
    } else {
      toast.info(`Navigate to the file's folder to manage it`);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
        <AlertTriangle className="h-8 w-8" />
        <p className="text-sm">Failed to load favorites</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500 fill-current" />
          <h1 className="text-xl font-semibold">Favorites</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {files?.length ?? 0} favorite{(files?.length ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!files || files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
            <Star className="h-12 w-12" />
            <p className="text-sm font-medium">No favorites yet</p>
            <p className="text-xs">Star files and folders to see them here</p>
          </div>
        ) : fileViewMode === "grid" ? (
          <div className="p-4">
            <FileGrid
              files={files}
              onNavigate={handleNavigate}
              onAction={handleAction}
            />
          </div>
        ) : (
          <FileList
            files={files}
            onNavigate={handleNavigate}
            onAction={handleAction}
          />
        )}
      </div>
    </div>
  );
}
