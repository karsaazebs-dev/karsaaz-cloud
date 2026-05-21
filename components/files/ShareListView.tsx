"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileIcon } from "@/components/files/FileIcon";
import { ExternalLink, Link2, Users } from "lucide-react";
import { SHARE_TYPE_LINK, permissionsLabel } from "@/lib/hooks/useSharing";
import { useAuth } from "@/lib/hooks/useAuth";
import type { OCSShare } from "@/lib/types/ocs.types";

interface ShareListViewProps {
  title: string;
  description: string;
  shares: OCSShare[] | undefined;
  isLoading: boolean;
  emptyText: string;
  /** Optional per-row action (e.g. restore a deleted share). */
  action?: { label: string; onClick: (share: OCSShare) => void; pending?: boolean };
}

export function ShareListView({
  title,
  description,
  shares,
  isLoading,
  emptyText,
  action,
}: ShareListViewProps) {
  const { username } = useAuth();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : !shares?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Users className="h-12 w-12 mb-3 opacity-20" />
          <p className="text-sm font-medium">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shares.map((share) => {
            const name = share.file_target || share.path || share.label || "Shared item";
            const isLink = share.share_type === SHARE_TYPE_LINK;
            return (
              <div key={share.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                {isLink ? (
                  <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Link2 className="h-4 w-4 text-primary" />
                  </div>
                ) : (
                  <FileIcon
                    file={{
                      id: share.id,
                      fileId: 0,
                      name,
                      type: "file",
                      mimeType: share.mimetype || "application/octet-stream",
                      fileType: "other",
                      size: 0,
                      lastModified: new Date(share.stime * 1000),
                      path: share.path,
                      etag: "",
                      permissions: share.permissions,
                      isFavorite: false,
                      isShared: true,
                      shareTypes: [share.share_type],
                      tags: [],
                      hasPreview: false,
                    }}
                    size="sm"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {isLink
                      ? "Public link"
                      : share.share_with_displayname ?? share.share_with ?? share.displayname_owner}
                    {" · "}
                    {permissionsLabel(share.permissions)}
                  </p>
                </div>
                {action ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={action.pending}
                    onClick={() => action.onClick(share)}
                  >
                    {action.label}
                  </Button>
                ) : (
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                    <a
                      href={`/api/proxy/remote.php/dav/files/${encodeURIComponent(username)}${share.file_target || share.path}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
