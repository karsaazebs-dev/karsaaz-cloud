"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileIcon } from "@/components/files/FileIcon";
import {
  X,
  Clock,
  Share2,
  Star,
  StarOff,
  Download,
  History,
} from "lucide-react";
import { formatFileSize, formatFileDate } from "@/lib/utils/files";
import { useFileVersions } from "@/lib/hooks/useVersionsTrash";
import { useShares } from "@/lib/hooks/useSharing";
import { cn } from "@/lib/utils";
import type { KarsaazFile } from "@/lib/types/file.types";
import { AnimatePresence, motion } from "framer-motion";
import { CommentsTab } from "@/components/files/FileCommentsTab";
import { ReminderTab } from "@/components/files/FileReminderTab";

interface FileDetailsPanelProps {
  file: KarsaazFile | null;
  filePath: string | null;
  onClose: () => void;
  onAction: (action: string, file: KarsaazFile) => void;
  initialTab?: DetailTab;
}

export type DetailTab = "info" | "sharing" | "versions" | "comments" | "reminder";

const TAB_LABELS: Record<DetailTab, string> = {
  info: "Info",
  sharing: "Shares",
  versions: "Versions",
  comments: "Comments",
  reminder: "Remind",
};

const TABS: DetailTab[] = ["info", "sharing", "versions", "comments", "reminder"];

export function FileDetailsPanel({
  file,
  filePath,
  onClose,
  onAction,
  initialTab = "info",
}: FileDetailsPanelProps) {
  const [tab, setTab] = useState<DetailTab>(initialTab);

  // When the panel is (re)opened targeting a specific tab, honor it.
  useEffect(() => {
    if (file) setTab(initialTab);
  }, [file, initialTab]);

  const { data: versions } = useFileVersions(file?.fileId ?? null);
  const { data: shares = [] } = useShares(file ? filePath : null);

  return (
    <AnimatePresence>
      {file && (
        <motion.aside
          key="details"
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="w-80 flex-shrink-0 border-l bg-background flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-sm truncate pr-2">{file.name}</h3>
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* File icon + quick actions */}
          <div className="flex flex-col items-center pt-6 pb-4 px-4 border-b gap-3">
            <FileIcon file={file} size="lg" />
            <div className="flex gap-2">
              {file.type !== "directory" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8"
                  onClick={() => onAction("download", file)}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8"
                onClick={() => onAction("favorite", file)}
              >
                {file.isFavorite ? (
                  <>
                    <StarOff className="h-3.5 w-3.5 mr-1.5 text-yellow-500" />
                    Unfavorite
                  </>
                ) : (
                  <>
                    <Star className="h-3.5 w-3.5 mr-1.5" />
                    Favorite
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b text-xs">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 py-2 font-medium transition-colors border-b-2 -mb-px",
                  tab === t
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {tab === "info" && <InfoTab file={file} />}
            {tab === "sharing" && <SharingTab shares={shares} onShare={() => onAction("share", file)} />}
            {tab === "versions" && <VersionsTab versions={versions} file={file} filePath={filePath} />}
            {tab === "comments" && <CommentsTab fileId={file.fileId} />}
            {tab === "reminder" && <ReminderTab fileId={file.fileId} />}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ─── Info tab ─────────────────────────────────────────────────────────────────

function InfoTab({ file }: { file: KarsaazFile }) {
  const rows: [string, React.ReactNode][] = [
    ["Name", <span key="n" className="break-all">{file.name}</span>],
    ["Type", file.type === "directory" ? "Folder" : (file.mimeType || "Unknown")],
    ["Size", file.type === "directory" ? "—" : formatFileSize(file.size)],
    ["Modified", formatFileDate(file.lastModified)],
    ...(file.etag ? [["ETag", <code key="e" className="text-xs">{file.etag}</code>] as [string, React.ReactNode]] : []),
    ...(file.permissions ? [["Permissions", String(file.permissions)] as [string, React.ReactNode]] : []),
  ];

  return (
    <div className="p-4 space-y-3">
      {/* Status badges */}
      {(file.isFavorite || file.isShared) && (
        <div className="flex gap-1.5 flex-wrap">
          {file.isFavorite && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              Favorite
            </Badge>
          )}
          {file.isShared && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Share2 className="h-3 w-3 text-blue-500" />
              Shared
            </Badge>
          )}
        </div>
      )}

      {/* Metadata rows */}
      <dl className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={String(label)} className="grid grid-cols-[90px_1fr] gap-2 text-sm">
            <dt className="text-muted-foreground font-medium">{label}</dt>
            <dd className="text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ─── Sharing tab ──────────────────────────────────────────────────────────────

import type { OCSShare } from "@/lib/types/ocs.types";
import { SHARE_TYPE_LINK, SHARE_TYPE_USER, SHARE_TYPE_GROUP, permissionsLabel } from "@/lib/hooks/useSharing";

function SharingTab({
  shares,
  onShare,
}: {
  shares: OCSShare[];
  onShare: () => void;
}) {
  if (shares.length === 0) {
    return (
      <div className="p-4 text-center space-y-3">
        <Share2 className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">Not shared yet</p>
        <Button size="sm" onClick={onShare} className="w-full">
          Share this file
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <Button size="sm" variant="outline" onClick={onShare} className="w-full">
        <Share2 className="h-4 w-4 mr-2" />
        Manage shares
      </Button>

      <div className="space-y-2">
        {shares.map((share) => (
          <div key={share.id} className="flex items-center gap-2 text-sm">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {share.share_type === SHARE_TYPE_LINK ? (
                <Share2 className="h-3.5 w-3.5 text-primary" />
              ) : (
                <span className="text-xs font-bold text-primary uppercase">
                  {(share.share_with_displayname ?? "?").charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {share.share_type === SHARE_TYPE_LINK
                  ? "Public link"
                  : (share.share_with_displayname ?? share.share_with)}
              </p>
              <p className="text-xs text-muted-foreground">
                {permissionsLabel(share.permissions)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Versions tab ─────────────────────────────────────────────────────────────

import type { FileVersion } from "@/lib/types/file.types";

function VersionsTab({
  versions,
  file,
  filePath,
}: {
  versions: FileVersion[] | undefined;
  file: KarsaazFile;
  filePath: string | null;
}) {
  if (!versions) {
    return (
      <div className="p-4 flex items-center justify-center text-muted-foreground text-sm">
        <History className="h-4 w-4 mr-2" />
        Loading versions…
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="p-4 text-center">
        <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No previous versions</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {versions.map((v) => (
        <div key={v.id} className="flex items-center gap-2 text-sm border rounded-lg p-2">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs">
              {new Date(v.timestamp).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(v.size)}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            title="Download this version"
            onClick={() => {
              const a = document.createElement("a");
              a.href = `/api/proxy${v.href}`;
              a.download = `${file.name} (${new Date(v.timestamp).toLocaleDateString()})`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
