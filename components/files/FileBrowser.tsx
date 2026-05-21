"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useFiles, useFileActions } from "@/lib/hooks/useFiles";
import { FileList } from "@/components/files/FileList";
import { FileGrid } from "@/components/files/FileGrid";
import { FileBreadcrumbs } from "@/components/files/FileBreadcrumbs";
import { FileToolbar } from "@/components/files/FileToolbar";
import { UploadDropzone } from "@/components/files/UploadDropzone";
import { BulkActionBar } from "@/components/files/BulkActionBar";
import { FileDetailsPanel, type DetailTab } from "@/components/files/FileDetailsPanel";
import { ShareDialog } from "@/components/files/ShareDialog";
import {
  NewFolderDialog,
  RenameDialog,
  DeleteDialog,
  BulkDeleteDialog,
  MoveDialog,
} from "@/components/files/FileDialogs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/lib/stores/ui.store";
import { buildFilePath } from "@/lib/utils/files";
import { isOfficeFile } from "@/lib/utils/officeFiles";
import { toast } from "sonner";
import type { KarsaazFile } from "@/lib/types/file.types";
import { useRouter } from "next/navigation";

type SessionData = { username?: string } & Record<string, unknown>;

interface FileBrowserProps {
  initialPath?: string;
}

type DialogType = "newFolder" | "rename" | "delete" | "upload" | "bulkDelete" | "move" | "copy" | "share" | null;

interface DialogState {
  type: DialogType;
  file?: KarsaazFile;
}

export function FileBrowser({ initialPath = "/" }: FileBrowserProps) {
  const { data: session } = useSession();
  const username = (session as SessionData | null)?.username as string | undefined;
  const router = useRouter();

  const [currentPath, setCurrentPath] = useState(initialPath);
  const [dialog, setDialog] = useState<DialogState>({ type: null });
  const [selectedFiles, setSelectedFiles] = useState<KarsaazFile[]>([]);
  const [detailsFile, setDetailsFile] = useState<KarsaazFile | null>(null);
  const [detailsTab, setDetailsTab] = useState<DetailTab>("info");

  const { fileViewMode, fileSortField, fileSortDirection } = useUIStore();

  const davPath = username ? buildFilePath(username, currentPath) : null;

  const { data: filesRaw, isLoading, error } = useFiles(davPath ?? "");
  const actions = useFileActions(davPath ?? "");

  const files = useMemo(() => {
    if (!filesRaw) return [];
    return [...filesRaw].sort((a, b) => {
      if (a.type === "directory" && b.type !== "directory") return -1;
      if (a.type !== "directory" && b.type === "directory") return 1;
      const dir = fileSortDirection === "asc" ? 1 : -1;
      const field = fileSortField as keyof KarsaazFile;
      const av = a[field] ?? "";
      const bv = b[field] ?? "";
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [filesRaw, fileSortField, fileSortDirection]);

  function closeDialog() {
    setDialog({ type: null });
  }

  function handleNavigate(file: KarsaazFile) {
    if (file.type === "directory") {
      setCurrentPath(`${currentPath}/${file.name}`.replace("//", "/"));
      setSelectedFiles([]);
      setDetailsFile(null);
    } else if (isOfficeFile(file.name)) {
      const filePath = `${currentPath}/${file.name}`.replace("//", "/");
      router.push(`/office?path=${encodeURIComponent(filePath)}`);
    } else {
      handleAction("download", file);
    }
  }

  function handleAction(action: string, file: KarsaazFile) {
    switch (action) {
      case "office":
        if (username) {
          const filePath = `${currentPath}/${file.name}`.replace("//", "/");
          router.push(`/office?path=${encodeURIComponent(filePath)}`);
        }
        break;
      case "open":
        setCurrentPath(`${currentPath}/${file.name}`.replace("//", "/"));
        setSelectedFiles([]);
        setDetailsFile(null);
        break;
      case "download":
        if (username) {
          const path = buildFilePath(username, `${currentPath}/${file.name}`);
          window.open(`/api/proxy${path}`, "_blank");
        }
        break;
      case "rename":
        setDialog({ type: "rename", file });
        break;
      case "delete":
        setDialog({ type: "delete", file });
        break;
      case "move":
        setDialog({ type: "move", file });
        break;
      case "copy":
        setDialog({ type: "copy", file });
        break;
      case "details":
        setDetailsTab("info");
        setDetailsFile(file === detailsFile ? null : file);
        break;
      case "comments":
        setDetailsTab("comments");
        setDetailsFile(file);
        break;
      case "reminder":
        setDetailsTab("reminder");
        setDetailsFile(file);
        break;
      case "share":
        setDialog({ type: "share", file });
        break;
      case "favorite":
        if (username) {
          const path = buildFilePath(username, `${currentPath}/${file.name}`);
          actions.toggleFavorite.mutate({ filePath: path, favorite: !file.isFavorite });
        }
        break;
      default:
        break;
    }
  }

  async function handleCreateFolder(name: string) {
    if (!davPath) return;
    await actions.createFolder.mutateAsync(name);
  }

  async function handleRename(newName: string) {
    if (!dialog.file || !username) return;
    const from = buildFilePath(username, `${currentPath}/${dialog.file.name}`);
    const to = buildFilePath(username, `${currentPath}/${newName}`);
    await actions.move.mutateAsync({ from, to });
  }

  async function handleDelete() {
    if (!dialog.file || !username) return;
    const path = buildFilePath(username, `${currentPath}/${dialog.file.name}`);
    await actions.deleteFile.mutateAsync(path);
  }

  async function handleMoveOrCopy(destination: string, mode: "move" | "copy") {
    if (!dialog.file || !username) return;
    const from = buildFilePath(username, `${currentPath}/${dialog.file.name}`);
    const to = buildFilePath(username, `${destination}/${dialog.file.name}`);
    if (mode === "move") {
      await actions.move.mutateAsync({ from, to });
    } else {
      await actions.copy.mutateAsync({ from, to });
    }
  }

  async function handleBulkDelete() {
    if (!username) return;
    for (const file of selectedFiles) {
      const path = buildFilePath(username, `${currentPath}/${file.name}`);
      await actions.deleteFile.mutateAsync(path);
    }
    setSelectedFiles([]);
    toast.success(`Deleted ${selectedFiles.length} items`);
  }

  async function handleBulkDownload() {
    if (!username) return;
    for (const file of selectedFiles) {
      if (file.type !== "directory") {
        const path = buildFilePath(username, `${currentPath}/${file.name}`);
        const a = document.createElement("a");
        a.href = `/api/proxy${path}`;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }

  async function handleBulkMove(destination: string) {
    if (!username) return;
    for (const file of selectedFiles) {
      const from = buildFilePath(username, `${currentPath}/${file.name}`);
      const to = buildFilePath(username, `${destination}/${file.name}`);
      await actions.move.mutateAsync({ from, to });
    }
    setSelectedFiles([]);
    toast.success(`Moved ${selectedFiles.length} items`);
  }

  async function handleBulkCopy(destination: string) {
    if (!username) return;
    for (const file of selectedFiles) {
      const from = buildFilePath(username, `${currentPath}/${file.name}`);
      const to = buildFilePath(username, `${destination}/${file.name}`);
      await actions.copy.mutateAsync({ from, to });
    }
    setSelectedFiles([]);
    toast.success(`Copied ${selectedFiles.length} items`);
  }

  const detailsFilePath = detailsFile && username
    ? buildFilePath(username, `${currentPath}/${detailsFile.name}`)
    : null;

  if (!username) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-4 px-4 py-2 border-b bg-background shrink-0">
        <FileBreadcrumbs path={currentPath} onNavigate={(p) => { setCurrentPath(p); setSelectedFiles([]); setDetailsFile(null); }} />
      </div>

      {/* Toolbar */}
      <FileToolbar
        onNewFolder={() => setDialog({ type: "newFolder" })}
        onUpload={() => setDialog({ type: "upload" })}
        selectedCount={selectedFiles.length}
        onDeleteSelected={() => setDialog({ type: "bulkDelete" })}
      />

      {/* Main area: file list + optional details panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* File list/grid */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
              <p className="font-medium text-destructive">Failed to load files</p>
              <p className="text-xs">{String(error)}</p>
            </div>
          ) : fileViewMode === "grid" ? (
            <div className="p-4">
              <FileGrid
                files={files}
                onNavigate={handleNavigate}
                onSelectionChange={setSelectedFiles}
                onAction={handleAction}
              />
            </div>
          ) : (
            <FileList
              files={files}
              onNavigate={handleNavigate}
              onSelectionChange={setSelectedFiles}
              onAction={handleAction}
            />
          )}
        </div>

        {/* Details panel (slide-in) */}
        <FileDetailsPanel
          file={detailsFile}
          filePath={detailsFilePath}
          initialTab={detailsTab}
          onClose={() => setDetailsFile(null)}
          onAction={handleAction}
        />
      </div>

      {/* Floating bulk action bar */}
      <BulkActionBar
        selectedFiles={selectedFiles}
        onClearSelection={() => setSelectedFiles([])}
        onDeleteSelected={() => setDialog({ type: "bulkDelete" })}
        onMoveSelected={() => setDialog({ type: "move" })}
        onCopySelected={() => setDialog({ type: "copy" })}
        onDownloadSelected={handleBulkDownload}
      />

      {/* ── Dialogs ── */}
      <NewFolderDialog
        open={dialog.type === "newFolder"}
        onOpenChange={(v) => !v && closeDialog()}
        onConfirm={handleCreateFolder}
      />

      {dialog.file && (
        <>
          <RenameDialog
            open={dialog.type === "rename"}
            onOpenChange={(v) => !v && closeDialog()}
            currentName={dialog.file.name}
            onConfirm={handleRename}
          />
          <DeleteDialog
            open={dialog.type === "delete"}
            onOpenChange={(v) => !v && closeDialog()}
            fileName={dialog.file.name}
            onConfirm={handleDelete}
          />
          <MoveDialog
            open={dialog.type === "move"}
            onOpenChange={(v) => !v && closeDialog()}
            sourceName={dialog.file.name}
            currentPath={currentPath}
            onConfirm={(dest) => handleMoveOrCopy(dest, "move")}
            mode="move"
          />
          <MoveDialog
            open={dialog.type === "copy"}
            onOpenChange={(v) => !v && closeDialog()}
            sourceName={dialog.file.name}
            currentPath={currentPath}
            onConfirm={(dest) => handleMoveOrCopy(dest, "copy")}
            mode="copy"
          />
          {dialog.type === "share" && (
            <ShareDialog
              open
              onOpenChange={(v) => !v && closeDialog()}
              file={dialog.file}
              filePath={buildFilePath(username, `${currentPath}/${dialog.file.name}`)}
            />
          )}
        </>
      )}

      {/* Bulk move/copy (no specific file, uses selectedFiles) */}
      {!dialog.file && dialog.type === "move" && (
        <MoveDialog
          open
          onOpenChange={(v) => !v && closeDialog()}
          sourceName={`${selectedFiles.length} items`}
          currentPath={currentPath}
          onConfirm={(dest) => handleBulkMove(dest)}
          mode="move"
        />
      )}
      {!dialog.file && dialog.type === "copy" && (
        <MoveDialog
          open
          onOpenChange={(v) => !v && closeDialog()}
          sourceName={`${selectedFiles.length} items`}
          currentPath={currentPath}
          onConfirm={(dest) => handleBulkCopy(dest)}
          mode="copy"
        />
      )}

      <BulkDeleteDialog
        open={dialog.type === "bulkDelete"}
        onOpenChange={(v) => !v && closeDialog()}
        count={selectedFiles.length}
        onConfirm={handleBulkDelete}
      />

      {/* Upload dialog */}
      <Dialog
        open={dialog.type === "upload"}
        onOpenChange={(v) => !v && closeDialog()}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload files</DialogTitle>
          </DialogHeader>
          <UploadDropzone
            currentPath={currentPath}
            onClose={closeDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
